-- Phase 1 core: businesses, inventory, customers, bookings and availability.
--
-- Rules this migration enforces (SRS v1.0):
--   * Booking states and allowed moves follow SRS section 4.2.
--   * A pending request does not reduce availability; an accepted booking does
--     (FR-CA-03). Stock is held from the start date to the end date plus the
--     item's turnaround days (FR-CA-05), and an OVERDUE booking keeps holding
--     stock until it is returned.
--   * No booking may push any item below zero on any day (FR-CA-02). The check
--     locks the item rows first, so two staff accepting conflicting bookings at
--     the same moment can never both succeed.
--   * Clients never write bookings directly: every change goes through the
--     functions below, which check membership and log a booking_events row.
--   * The platform never holds rental money. Payment records come later and
--     only record what the business received.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.member_role as enum ('owner', 'staff');

create type public.booking_source as enum ('direct', 'marketplace');

create type public.booking_status as enum (
  'REQUESTED',
  'ACCEPTED',
  'FEE_PENDING',
  'CONFIRMED',
  'CHECKED_OUT',
  'OVERDUE',
  'RETURNED',
  'PROBLEM_OPEN',
  'CLOSED',
  'DECLINED',
  'EXPIRED',
  'CANCELLED'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  towns text[] not null default '{}',
  phone text,
  whatsapp text,
  -- FR-BK-04: unanswered requests expire after this many hours.
  request_expiry_hours integer not null default 24 check (request_expiry_hours > 0),
  created_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index business_members_user_idx on public.business_members (user_id);

-- FR-IN-06: categories start with Events, Tools, and Construction and Machinery.
create table public.categories (
  slug text primary key,
  name text not null,
  sort_order integer not null default 0
);

insert into public.categories (slug, name, sort_order) values
  ('events', 'Events', 10),
  ('tools', 'Tools', 20),
  ('construction-machinery', 'Construction and Machinery', 30),
  ('other', 'Other', 100);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  category text not null references public.categories (slug),
  description text,
  -- FR-IN-02: one listing covers many identical units.
  quantity_owned integer not null check (quantity_owned >= 0),
  -- FR-IN-04: units under repair or retired are out of available stock.
  units_out_of_service integer not null default 0 check (units_out_of_service >= 0),
  daily_price numeric(12, 2) not null check (daily_price >= 0),
  deposit numeric(12, 2) not null default 0 check (deposit >= 0),
  replacement_value numeric(12, 2) check (replacement_value >= 0),
  turnaround_days integer not null default 0 check (turnaround_days between 0 and 30),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  is_public boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (units_out_of_service <= quantity_owned)
);

create index items_business_idx on public.items (business_id) where not archived;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  notes text,
  created_at timestamptz not null default now(),
  unique (business_id, phone)
);

create sequence public.booking_reference_seq;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default 'BK-' || lpad(nextval('public.booking_reference_seq')::text, 6, '0'),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id),
  source public.booking_source not null default 'direct',
  status public.booking_status not null default 'REQUESTED',
  -- Both dates are inclusive, in Namibian time.
  start_date date not null,
  end_date date not null,
  deposit_amount numeric(12, 2) not null default 0 check (deposit_amount >= 0),
  notes text,
  request_expires_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index bookings_business_dates_idx on public.bookings (business_id, start_date, end_date);

create table public.booking_items (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  item_id uuid not null references public.items (id),
  quantity integer not null check (quantity > 0),
  -- Price per unit per day at the time of booking.
  daily_price numeric(12, 2) not null check (daily_price >= 0),
  primary key (booking_id, item_id)
);

create index booking_items_item_idx on public.booking_items (item_id);

-- FR-BK-01: full event history. Append-only for clients.
create table public.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  note text,
  actor uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index booking_events_booking_idx on public.booking_events (booking_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.namibia_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Windhoek')::date;
$$;

create function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business_id and m.user_id = auth.uid()
  );
$$;

create function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- States in which a booking holds stock on the calendar.
create function public.booking_holds_stock(p_status public.booking_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_status in ('ACCEPTED', 'FEE_PENDING', 'CONFIRMED', 'CHECKED_OUT', 'OVERDUE');
$$;

-- SRS section 4.2: which state may follow which.
create function public.booking_transition_allowed(
  p_from public.booking_status,
  p_to public.booking_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_from
    when 'REQUESTED' then p_to in ('ACCEPTED', 'DECLINED', 'EXPIRED')
    when 'ACCEPTED' then p_to in ('FEE_PENDING', 'CONFIRMED', 'CANCELLED')
    when 'FEE_PENDING' then p_to in ('CONFIRMED', 'EXPIRED')
    when 'CONFIRMED' then p_to in ('CHECKED_OUT', 'CANCELLED')
    when 'CHECKED_OUT' then p_to in ('RETURNED', 'OVERDUE')
    when 'OVERDUE' then p_to in ('RETURNED')
    when 'RETURNED' then p_to in ('CLOSED', 'PROBLEM_OPEN')
    when 'PROBLEM_OPEN' then p_to in ('CLOSED')
    else false
  end;
$$;

-- Units of each item held by stock-holding bookings on each day of a range.
-- Internal: callers must check membership first.
create function public._booked_units(
  p_item_ids uuid[],
  p_from date,
  p_to date,
  p_exclude_booking uuid default null
)
returns table (item_id uuid, day date, booked integer)
language sql
stable
security definer
set search_path = ''
as $$
  select bi.item_id, d.day::date, sum(bi.quantity)::integer
  from public.booking_items bi
  join public.bookings b on b.id = bi.booking_id
  join public.items i on i.id = bi.item_id
  cross join lateral generate_series(
    greatest(b.start_date, p_from),
    least(
      case when b.status = 'OVERDUE'
        then greatest(b.end_date, public.namibia_today())
        else b.end_date
      end + i.turnaround_days,
      p_to
    ),
    interval '1 day'
  ) as d (day)
  where bi.item_id = any (p_item_ids)
    and public.booking_holds_stock(b.status)
    and (p_exclude_booking is null or b.id <> p_exclude_booking)
  group by bi.item_id, d.day;
$$;

-- FR-CA-02: raise if putting this booking's items on hold would exceed stock
-- on any day. Locks the item rows so concurrent checks for the same items run
-- one after another.
create function public._assert_booking_fits(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_item_ids uuid[];
  v_shortfall record;
begin
  select * into v_booking from public.bookings where id = p_booking_id;

  select array_agg(item_id order by item_id) into v_item_ids
  from public.booking_items where booking_id = p_booking_id;

  if v_item_ids is null then
    raise exception 'Booking % has no items', v_booking.reference;
  end if;

  -- Lock in a fixed order to avoid deadlocks between concurrent accepts.
  perform 1 from public.items where id = any (v_item_ids) order by id for update;

  select i.name, d.day::date as day,
         i.quantity_owned - i.units_out_of_service - coalesce(bu.booked, 0) as available,
         bi.quantity as needed
  into v_shortfall
  from public.booking_items bi
  join public.items i on i.id = bi.item_id
  cross join lateral generate_series(
    v_booking.start_date,
    v_booking.end_date + i.turnaround_days,
    interval '1 day'
  ) as d (day)
  left join public._booked_units(
    v_item_ids,
    v_booking.start_date,
    v_booking.end_date + 30,
    p_booking_id
  ) bu on bu.item_id = bi.item_id and bu.day = d.day::date
  where bi.booking_id = p_booking_id
    and i.quantity_owned - i.units_out_of_service - coalesce(bu.booked, 0) < bi.quantity
  order by d.day, i.name
  limit 1;

  if found then
    raise exception 'Not enough "%" on %: % available, % needed',
      v_shortfall.name, v_shortfall.day, greatest(v_shortfall.available, 0), v_shortfall.needed
      using errcode = 'P0001', hint = 'double_booking';
  end if;
end;
$$;

-- Moves a booking to a new state, checking section 4.2, stock and membership.
create function public._move_booking(
  p_booking_id uuid,
  p_to public.booking_status,
  p_note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_from public.booking_status;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if not found or not public.is_business_member(v_booking.business_id) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  if not public.booking_transition_allowed(v_booking.status, p_to) then
    raise exception 'A % booking cannot become %', v_booking.status, p_to;
  end if;

  if public.booking_holds_stock(p_to) and not public.booking_holds_stock(v_booking.status) then
    perform public._assert_booking_fits(p_booking_id);
  end if;

  v_from := v_booking.status;

  update public.bookings
  set status = p_to, updated_at = now()
  where id = p_booking_id
  returning * into v_booking;

  insert into public.booking_events (booking_id, from_status, to_status, note, actor)
  values (p_booking_id, v_from, p_to, p_note, auth.uid());

  return v_booking;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public API (called with supabase.rpc)
-- ---------------------------------------------------------------------------

-- Creates a business and makes the caller its owner.
create function public.create_business(p_name text, p_towns text[] default '{}')
returns public.businesses
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses;
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;

  insert into public.businesses (name, towns)
  values (trim(p_name), coalesce(p_towns, '{}'))
  returning * into v_business;

  insert into public.business_members (business_id, user_id, role)
  values (v_business.id, auth.uid(), 'owner');

  return v_business;
end;
$$;

-- FR-BK-02: staff create a booking for a phone, walk-in or WhatsApp customer.
-- p_lines is a JSON array like [{"item_id": "...", "quantity": 10}].
-- With p_accept = true the booking is accepted and confirmed straight away,
-- which runs the double-booking check; otherwise it waits as REQUESTED.
create function public.create_booking(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_start_date date,
  p_end_date date,
  p_lines jsonb,
  p_accept boolean default true,
  p_notes text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses;
  v_customer_id uuid;
  v_booking public.bookings;
  v_line_count integer;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;

  if p_end_date < p_start_date then
    raise exception 'The end date must be on or after the start date';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Add at least one item';
  end if;

  select * into v_business from public.businesses where id = p_business_id;

  insert into public.customers (business_id, full_name, phone)
  values (p_business_id, trim(p_customer_name), trim(p_customer_phone))
  on conflict (business_id, phone) do update set full_name = excluded.full_name
  returning id into v_customer_id;

  insert into public.bookings (
    business_id, customer_id, source, status, start_date, end_date,
    notes, request_expires_at, created_by
  )
  values (
    p_business_id, v_customer_id, 'direct', 'REQUESTED', p_start_date, p_end_date,
    p_notes, now() + make_interval(hours => v_business.request_expiry_hours), auth.uid()
  )
  returning * into v_booking;

  insert into public.booking_items (booking_id, item_id, quantity, daily_price)
  select v_booking.id, i.id, (line ->> 'quantity')::integer, i.daily_price
  from jsonb_array_elements(p_lines) as line
  join public.items i
    on i.id = (line ->> 'item_id')::uuid
   and i.business_id = p_business_id
   and not i.archived;

  get diagnostics v_line_count = row_count;
  if v_line_count <> jsonb_array_length(p_lines) then
    raise exception 'One or more items do not belong to this business';
  end if;

  update public.bookings b
  set deposit_amount = (
    select coalesce(sum(i.deposit * bi.quantity), 0)
    from public.booking_items bi join public.items i on i.id = bi.item_id
    where bi.booking_id = b.id
  )
  where b.id = v_booking.id;

  insert into public.booking_events (booking_id, from_status, to_status, note, actor)
  values (v_booking.id, null, 'REQUESTED', 'Created by staff', auth.uid());

  if p_accept then
    v_booking := public.accept_booking(v_booking.id);
  else
    select * into v_booking from public.bookings where id = v_booking.id;
  end if;

  return v_booking;
end;
$$;

-- FR-BK-04: accept a request. Direct bookings are confirmed at once (section
-- 4.2); marketplace bookings wait for the booking fee (Phase 2).
create function public.accept_booking(p_booking_id uuid, p_note text default null)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  v_booking := public._move_booking(p_booking_id, 'ACCEPTED', p_note);

  if v_booking.source = 'direct' then
    v_booking := public._move_booking(p_booking_id, 'CONFIRMED', 'Direct booking confirmed on accept');
  else
    v_booking := public._move_booking(p_booking_id, 'FEE_PENDING', 'Waiting for booking fee');
  end if;

  return v_booking;
end;
$$;

create function public.decline_booking(p_booking_id uuid, p_reason text default null)
returns public.bookings
language sql
security definer
set search_path = ''
as $$
  select public._move_booking(p_booking_id, 'DECLINED', p_reason);
$$;

-- FR-BK-06: cancel before checkout, with a reason.
create function public.cancel_booking(p_booking_id uuid, p_reason text)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Give a reason for cancelling';
  end if;
  return public._move_booking(p_booking_id, 'CANCELLED', p_reason);
end;
$$;

-- Checkout, return and close records (FR-CR) come next; until then staff can
-- move a booking along the remaining section 4.2 steps with a note.
create function public.set_booking_status(
  p_booking_id uuid,
  p_to public.booking_status,
  p_note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_to in ('ACCEPTED', 'CONFIRMED', 'FEE_PENDING') then
    raise exception 'Use accept_booking to accept a booking';
  end if;
  return public._move_booking(p_booking_id, p_to, p_note);
end;
$$;

-- FR-CA-01 / FR-CA-04: per item, per day: stock in service, units held, units free.
create function public.item_availability(p_business_id uuid, p_from date, p_to date)
returns table (
  item_id uuid,
  day date,
  in_service integer,
  booked integer,
  available integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;
  if p_to < p_from or p_to - p_from > 366 then
    raise exception 'Choose a range of at most one year';
  end if;

  return query
  with biz_items as (
    select i.id, i.quantity_owned - i.units_out_of_service as in_service
    from public.items i
    where i.business_id = p_business_id and not i.archived
  )
  select bi.id, d.day::date, bi.in_service,
         coalesce(bu.booked, 0),
         bi.in_service - coalesce(bu.booked, 0)
  from biz_items bi
  cross join generate_series(p_from, p_to, interval '1 day') as d (day)
  left join public._booked_units(
    array(select id from biz_items), p_from, p_to
  ) bu on bu.item_id = bi.id and bu.day = d.day::date
  order by bi.id, d.day;
end;
$$;

-- FR-IN-04: reducing or archiving stock must not strand bookings that hold it.
create function public._items_guard_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date;
  v_new_capacity integer :=
    case when new.archived then 0 else new.quantity_owned - new.units_out_of_service end;
begin
  new.updated_at := now();

  if v_new_capacity < old.quantity_owned - old.units_out_of_service
     or (new.archived and not old.archived) then
    select bu.day into v_day
    from public._booked_units(
      array[new.id],
      public.namibia_today(),
      greatest(
        public.namibia_today(),
        (select max(b.end_date) from public.bookings b
         join public.booking_items bi on bi.booking_id = b.id
         where bi.item_id = new.id and public.booking_holds_stock(b.status))
      ) + new.turnaround_days
    ) bu
    where bu.booked > v_new_capacity
    order by bu.day
    limit 1;

    if found then
      raise exception 'Bookings already hold more "%" than that on %', new.name, v_day
        using hint = 'double_booking';
    end if;
  end if;

  return new;
end;
$$;

create trigger items_guard_stock
before update on public.items
for each row execute function public._items_guard_stock();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.booking_events enable row level security;

create policy "members read their business" on public.businesses
  for select to authenticated using (public.is_business_member(id));
create policy "owners update their business" on public.businesses
  for update to authenticated
  using (public.is_business_owner(id)) with check (public.is_business_owner(id));

create policy "members read the team" on public.business_members
  for select to authenticated using (public.is_business_member(business_id));

create policy "anyone signed in reads categories" on public.categories
  for select to authenticated using (true);

create policy "members read items" on public.items
  for select to authenticated using (public.is_business_member(business_id));
create policy "members add items" on public.items
  for insert to authenticated with check (public.is_business_member(business_id));
create policy "members update items" on public.items
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members read customers" on public.customers
  for select to authenticated using (public.is_business_member(business_id));
create policy "members add customers" on public.customers
  for insert to authenticated with check (public.is_business_member(business_id));
create policy "members update customers" on public.customers
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- Bookings are read-only to clients; writes go through the functions above.
create policy "members read bookings" on public.bookings
  for select to authenticated using (public.is_business_member(business_id));
create policy "members read booking items" on public.booking_items
  for select to authenticated using (
    exists (select 1 from public.bookings b
            where b.id = booking_id and public.is_business_member(b.business_id))
  );
create policy "members read booking events" on public.booking_events
  for select to authenticated using (
    exists (select 1 from public.bookings b
            where b.id = booking_id and public.is_business_member(b.business_id))
  );

-- ---------------------------------------------------------------------------
-- Grants: internal helpers are not callable from the API.
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;
revoke execute on function public._booked_units(uuid[], date, date, uuid) from authenticated;
revoke execute on function public._assert_booking_fits(uuid) from authenticated;
revoke execute on function public._move_booking(uuid, public.booking_status, text) from authenticated;
revoke execute on function public._items_guard_stock() from authenticated;
