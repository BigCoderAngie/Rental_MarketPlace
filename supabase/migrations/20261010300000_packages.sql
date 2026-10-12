-- FR-IN-03: packages. A package groups items (for example "Wedding 100": a
-- tent, 100 chairs and 10 tables) and has its own price per day.
--
-- Booking or quoting a package puts its items on the booking as usual, so
-- stock and the double-booking check work exactly as before. Each booking line
-- remembers how many of its units came from packages (package_units); those
-- units are charged through the package's price instead of the item price.
-- So 1 × "Wedding 100" plus 20 extra chairs is one chair line of 120 units,
-- 100 of them in the package and 20 at the chair price.

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  daily_price numeric(12, 2) not null check (daily_price >= 0),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index packages_business_idx on public.packages (business_id) where not archived;

create table public.package_items (
  package_id uuid not null references public.packages (id) on delete cascade,
  item_id uuid not null references public.items (id),
  quantity integer not null check (quantity > 0),
  primary key (package_id, item_id)
);

alter table public.booking_items
  add column package_units integer not null default 0,
  add check (package_units >= 0 and package_units <= quantity);
alter table public.quote_items
  add column package_units integer not null default 0,
  add check (package_units >= 0 and package_units <= quantity);

-- Packages on a booking or quote, at the price they were booked at.
create table public.booking_packages (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  package_id uuid not null references public.packages (id),
  quantity integer not null check (quantity > 0),
  daily_price numeric(12, 2) not null check (daily_price >= 0),
  primary key (booking_id, package_id)
);
create table public.quote_packages (
  quote_id uuid not null references public.quotes (id) on delete cascade,
  package_id uuid not null references public.packages (id),
  quantity integer not null check (quantity > 0),
  daily_price numeric(12, 2) not null check (daily_price >= 0),
  primary key (quote_id, package_id)
);

-- ---------------------------------------------------------------------------
-- Staff API for packages
-- ---------------------------------------------------------------------------

-- Creates a package, or replaces one's details and contents when p_package_id
-- is given. p_lines is [{"item_id": "...", "quantity": 100}].
create function public.save_package(
  p_business_id uuid,
  p_package_id uuid,
  p_name text,
  p_description text,
  p_daily_price numeric,
  p_lines jsonb
)
returns public.packages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_package public.packages;
  v_line_count integer;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Give the package a name';
  end if;
  if p_daily_price is null or p_daily_price < 0 then
    raise exception 'Enter the package price per day';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array'
     or not exists (select 1 from jsonb_array_elements(p_lines) l where (l ->> 'quantity')::integer > 0) then
    raise exception 'Add at least one item to the package';
  end if;

  if p_package_id is null then
    insert into public.packages (business_id, name, description, daily_price)
    values (p_business_id, trim(p_name), nullif(trim(p_description), ''), p_daily_price)
    returning * into v_package;
  else
    update public.packages
    set name = trim(p_name), description = nullif(trim(p_description), ''), daily_price = p_daily_price
    where id = p_package_id and business_id = p_business_id and not archived
    returning * into v_package;
    if not found then
      raise exception 'Package not found' using errcode = 'P0002';
    end if;
    delete from public.package_items where package_id = v_package.id;
  end if;

  insert into public.package_items (package_id, item_id, quantity)
  select v_package.id, i.id, (l ->> 'quantity')::integer
  from jsonb_array_elements(p_lines) l
  join public.items i
    on i.id = (l ->> 'item_id')::uuid and i.business_id = p_business_id and not i.archived
  where (l ->> 'quantity')::integer > 0;

  get diagnostics v_line_count = row_count;
  if v_line_count <> (select count(*) from jsonb_array_elements(p_lines) l
                      where (l ->> 'quantity')::integer > 0) then
    raise exception 'One or more items do not belong to this business';
  end if;

  return v_package;
end;
$$;

create function public.archive_package(p_package_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.packages set archived = true
  where id = p_package_id and public.is_business_member(business_id);
  if not found then
    raise exception 'Package not found' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Helpers that turn package lines into item lines
-- ---------------------------------------------------------------------------

-- The package lines in p_lines ({"package_id", "quantity"}), with today's
-- package price: [{"package_id", "quantity", "daily_price"}].
create function public._package_lines(p_business_id uuid, p_lines jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if exists (select 1 from jsonb_array_elements(coalesce(p_lines, '[]')) l
             where l ? 'package_id' and (l ->> 'quantity')::integer < 0) then
    raise exception 'Quantities cannot be negative';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'package_id', n.package_id, 'quantity', n.quantity, 'daily_price', p.daily_price)), '[]')
  into v_result
  from (
    select (l ->> 'package_id')::uuid as package_id, sum((l ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(coalesce(p_lines, '[]')) l
    where l ? 'package_id' and (l ->> 'quantity')::integer > 0
    group by 1
  ) n
  left join public.packages p on p.id = n.package_id and p.business_id = p_business_id;

  if exists (select 1 from jsonb_array_elements(v_result) r where r ->> 'daily_price' is null) then
    raise exception 'One or more packages do not belong to this business';
  end if;
  return v_result;
end;
$$;

-- p_lines with every package replaced by its items, merged per item:
-- [{"item_id", "quantity", "package_units"}]. Lines with 0 are dropped.
create function public._expand_package_lines(p_business_id uuid, p_lines jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if exists (select 1 from jsonb_array_elements(coalesce(p_lines, '[]')) l
             where (l ->> 'quantity')::integer < 0) then
    raise exception 'Quantities cannot be negative';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'item_id', u.item_id, 'quantity', sum_quantity, 'package_units', sum_package_units)), '[]')
  into v_result
  from (
    select item_id, sum(quantity)::integer as sum_quantity, sum(package_units)::integer as sum_package_units
    from (
      select (l ->> 'item_id')::uuid as item_id, (l ->> 'quantity')::integer as quantity, 0 as package_units
      from jsonb_array_elements(coalesce(p_lines, '[]')) l
      where l ? 'item_id'
      union all
      select pi.item_id, pi.quantity * (l ->> 'quantity')::integer, pi.quantity * (l ->> 'quantity')::integer
      from jsonb_array_elements(coalesce(p_lines, '[]')) l
      join public.packages p on p.id = (l ->> 'package_id')::uuid and p.business_id = p_business_id
      join public.package_items pi on pi.package_id = p.id
      where l ? 'package_id'
    ) lines
    group by item_id
    having sum(quantity) > 0
  ) u;

  return v_result;
end;
$$;

-- "1 × Tent, 100 × Chair", for the customer's pages.
create function public._package_contents(p_package_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select string_agg(pi.quantity || ' × ' || i.name, ', ' order by i.name)
  from public.package_items pi join public.items i on i.id = pi.item_id
  where pi.package_id = p_package_id;
$$;

-- ---------------------------------------------------------------------------
-- Totals count package units at the package price, not the item price
-- ---------------------------------------------------------------------------

create or replace function public.booking_total(p_booking_id uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  select greatest(
    (
      coalesce((select sum((bi.quantity - bi.package_units) * bi.daily_price)
                from public.booking_items bi where bi.booking_id = b.id), 0)
      + coalesce((select sum(bp.quantity * bp.daily_price)
                  from public.booking_packages bp where bp.booking_id = b.id), 0)
    ) * (b.end_date - b.start_date + 1)
      + b.delivery_fee + b.setup_fee - b.discount,
    0
  )
  from public.bookings b
  where b.id = p_booking_id;
$$;

create or replace function public.quote_total(p_quote_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    (
      coalesce((select sum((qi.quantity - qi.package_units) * qi.daily_price)
                from public.quote_items qi where qi.quote_id = q.id), 0)
      + coalesce((select sum(qp.quantity * qp.daily_price)
                  from public.quote_packages qp where qp.quote_id = q.id), 0)
    ) * (q.end_date - q.start_date + 1)
      + q.delivery_fee + q.setup_fee - q.discount,
    0
  )
  from public.quotes q
  where q.id = p_quote_id;
$$;

-- ---------------------------------------------------------------------------
-- Creating, changing and accepting take package lines
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
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
  v_packages jsonb;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;

  if p_end_date < p_start_date then
    raise exception 'The end date must be on or after the start date';
  end if;

  v_packages := public._package_lines(p_business_id, p_lines);
  p_lines := public._expand_package_lines(p_business_id, p_lines);
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

  insert into public.booking_items (booking_id, item_id, quantity, package_units, daily_price)
  select v_booking.id, i.id, (line ->> 'quantity')::integer, (line ->> 'package_units')::integer, i.daily_price
  from jsonb_array_elements(p_lines) as line
  join public.items i
    on i.id = (line ->> 'item_id')::uuid
   and i.business_id = p_business_id
   and not i.archived;

  get diagnostics v_line_count = row_count;
  if v_line_count <> jsonb_array_length(p_lines) then
    raise exception 'One or more items do not belong to this business';
  end if;

  insert into public.booking_packages (booking_id, package_id, quantity, daily_price)
  select v_booking.id, (p ->> 'package_id')::uuid, (p ->> 'quantity')::integer, (p ->> 'daily_price')::numeric
  from jsonb_array_elements(v_packages) p;

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

create or replace function public.create_quote(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_start_date date,
  p_end_date date,
  p_lines jsonb,
  p_delivery_fee numeric default 0,
  p_setup_fee numeric default 0,
  p_discount numeric default 0,
  p_notes text default null
)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses;
  v_quote public.quotes;
  v_line_count integer;
  v_packages jsonb;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;

  if p_end_date < p_start_date then
    raise exception 'The end date must be on or after the start date';
  end if;

  v_packages := public._package_lines(p_business_id, p_lines);
  p_lines := public._expand_package_lines(p_business_id, p_lines);
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Add at least one item';
  end if;

  select * into v_business from public.businesses where id = p_business_id;

  insert into public.quotes (
    business_id, customer_name, customer_phone, start_date, end_date,
    delivery_fee, setup_fee, discount, notes, expires_at, created_by
  )
  values (
    p_business_id, trim(p_customer_name), nullif(trim(p_customer_phone), ''),
    p_start_date, p_end_date,
    coalesce(p_delivery_fee, 0), coalesce(p_setup_fee, 0), coalesce(p_discount, 0),
    p_notes, now() + make_interval(days => v_business.quote_validity_days), auth.uid()
  )
  returning * into v_quote;

  insert into public.quote_items (quote_id, item_id, quantity, package_units, daily_price)
  select v_quote.id, i.id, (line ->> 'quantity')::integer, (line ->> 'package_units')::integer, i.daily_price
  from jsonb_array_elements(p_lines) as line
  join public.items i
    on i.id = (line ->> 'item_id')::uuid
   and i.business_id = p_business_id
   and not i.archived;

  get diagnostics v_line_count = row_count;
  if v_line_count <> jsonb_array_length(p_lines) then
    raise exception 'One or more items do not belong to this business';
  end if;

  insert into public.quote_packages (quote_id, package_id, quantity, daily_price)
  select v_quote.id, (p ->> 'package_id')::uuid, (p ->> 'quantity')::integer, (p ->> 'daily_price')::numeric
  from jsonb_array_elements(v_packages) p;

  update public.quotes q
  set deposit_amount = (
    select coalesce(sum(i.deposit * qi.quantity), 0)
    from public.quote_items qi join public.items i on i.id = qi.item_id
    where qi.quote_id = q.id
  )
  where q.id = v_quote.id
  returning * into v_quote;

  return v_quote;
end;
$$;

create or replace function public.update_booking(
  p_booking_id uuid,
  p_start_date date,
  p_end_date date,
  p_lines jsonb,
  p_note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_old_start date;
  v_old_end date;
  v_old_items text;
  v_new_items text;
  v_changes text[] := '{}';
  v_packages jsonb;
  v_old_packages text;
  v_new_packages text;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if not found or not public.is_business_member(v_booking.business_id) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  if v_booking.status not in ('REQUESTED', 'ACCEPTED', 'FEE_PENDING', 'CONFIRMED') then
    raise exception 'A % booking can no longer be changed', lower(replace(v_booking.status::text, '_', ' '));
  end if;

  if p_start_date is null or p_end_date is null then
    raise exception 'Choose the dates';
  end if;
  if p_end_date < p_start_date then
    raise exception 'The end date must be on or after the start date';
  end if;
  v_packages := public._package_lines(v_booking.business_id, p_lines);
  p_lines := public._expand_package_lines(v_booking.business_id, p_lines);
  if p_lines is null or jsonb_typeof(p_lines) <> 'array'
     or not exists (select 1 from jsonb_array_elements(p_lines) l where (l ->> 'quantity')::integer > 0) then
    raise exception 'Add at least one item';
  end if;
  if exists (select 1 from jsonb_array_elements(p_lines) l where (l ->> 'quantity')::integer < 0) then
    raise exception 'Quantities cannot be negative';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_lines) l
    where (l ->> 'quantity')::integer > 0
      and not exists (
        select 1 from public.items i
        where i.id = (l ->> 'item_id')::uuid and i.business_id = v_booking.business_id
          and (not i.archived
               or exists (select 1 from public.booking_items bi
                          where bi.booking_id = p_booking_id and bi.item_id = i.id))
      )
  ) then
    raise exception 'One or more items do not belong to this business';
  end if;

  -- What changed, for the history.
  v_old_start := v_booking.start_date;
  v_old_end := v_booking.end_date;
  select string_agg(bi.quantity || ' × ' || i.name, ', ' order by i.name) into v_old_items
  from public.booking_items bi join public.items i on i.id = bi.item_id
  where bi.booking_id = p_booking_id;

  select string_agg(bp.quantity || ' × ' || p.name, ', ' order by p.name) into v_old_packages
  from public.booking_packages bp join public.packages p on p.id = bp.package_id
  where bp.booking_id = p_booking_id;

  -- Replace the packages and lines, keeping the booked price for those already on it.
  delete from public.booking_packages bp
  where bp.booking_id = p_booking_id
    and not exists (select 1 from jsonb_array_elements(v_packages) n
                    where (n ->> 'package_id')::uuid = bp.package_id);

  insert into public.booking_packages (booking_id, package_id, quantity, daily_price)
  select p_booking_id, (n ->> 'package_id')::uuid, (n ->> 'quantity')::integer, (n ->> 'daily_price')::numeric
  from jsonb_array_elements(v_packages) n
  on conflict (booking_id, package_id) do update set quantity = excluded.quantity;

  delete from public.booking_items bi
  where bi.booking_id = p_booking_id
    and not exists (
      select 1 from jsonb_array_elements(p_lines) l
      where (l ->> 'item_id')::uuid = bi.item_id and (l ->> 'quantity')::integer > 0
    );

  insert into public.booking_items (booking_id, item_id, quantity, package_units, daily_price)
  select p_booking_id, n.item_id, n.quantity, n.package_units, i.daily_price
  from (
    select (l ->> 'item_id')::uuid as item_id,
           sum((l ->> 'quantity')::integer)::integer as quantity,
           sum((l ->> 'package_units')::integer)::integer as package_units
    from jsonb_array_elements(p_lines) l
    where (l ->> 'quantity')::integer > 0
    group by 1
  ) n
  join public.items i on i.id = n.item_id
  on conflict (booking_id, item_id)
    do update set quantity = excluded.quantity, package_units = excluded.package_units;

  update public.bookings b
  set start_date = p_start_date,
      end_date = p_end_date,
      deposit_amount = (
        select coalesce(sum(i.deposit * bi.quantity), 0)
        from public.booking_items bi join public.items i on i.id = bi.item_id
        where bi.booking_id = b.id
      ),
      updated_at = now()
  where b.id = p_booking_id
  returning * into v_booking;

  if public.booking_holds_stock(v_booking.status) then
    perform public._assert_booking_fits(p_booking_id);
  end if;

  select string_agg(bi.quantity || ' × ' || i.name, ', ' order by i.name) into v_new_items
  from public.booking_items bi join public.items i on i.id = bi.item_id
  where bi.booking_id = p_booking_id;

  if v_old_start <> p_start_date or v_old_end <> p_end_date then
    v_changes := v_changes || format('dates %s to %s (were %s to %s)',
      to_char(p_start_date, 'DD Mon'), to_char(p_end_date, 'DD Mon'),
      to_char(v_old_start, 'DD Mon'), to_char(v_old_end, 'DD Mon'));
  end if;
  select string_agg(bp.quantity || ' × ' || p.name, ', ' order by p.name) into v_new_packages
  from public.booking_packages bp join public.packages p on p.id = bp.package_id
  where bp.booking_id = p_booking_id;

  if v_old_packages is distinct from v_new_packages then
    v_changes := v_changes || format('packages %s (were %s)',
      coalesce(v_new_packages, 'none'), coalesce(v_old_packages, 'none'));
  end if;
  if v_old_items is distinct from v_new_items then
    v_changes := v_changes || format('items %s (were %s)', v_new_items, v_old_items);
  end if;
  if cardinality(v_changes) = 0 then
    raise exception 'Nothing was changed';
  end if;

  insert into public.booking_events (booking_id, from_status, to_status, note, actor)
  values (
    p_booking_id, v_booking.status, v_booking.status,
    'Changed ' || array_to_string(v_changes, '; ')
      || coalesce('. ' || nullif(trim(p_note), ''), ''),
    auth.uid()
  );

  return v_booking;
end;
$$;

create or replace function public.accept_public_quote(
  p_token text,
  p_customer_name text,
  p_customer_phone text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public.quotes;
  v_business public.businesses;
  v_customer_id uuid;
  v_booking public.bookings;
begin
  select * into v_quote from public.quotes where public_token = p_token for update;

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if v_quote.status = 'ACCEPTED' then
    raise exception 'This quote has already been accepted';
  end if;
  if v_quote.status = 'CANCELLED' then
    raise exception 'This quote was withdrawn by the business';
  end if;
  if v_quote.expires_at < now() then
    raise exception 'This quote has expired. Ask the business for a new one.';
  end if;
  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = '' then
    raise exception 'Enter your name and phone number';
  end if;

  select * into v_business from public.businesses where id = v_quote.business_id;

  insert into public.customers (business_id, full_name, phone)
  values (v_quote.business_id, trim(p_customer_name), trim(p_customer_phone))
  on conflict (business_id, phone) do update set full_name = excluded.full_name
  returning id into v_customer_id;

  insert into public.bookings (
    business_id, customer_id, source, status, start_date, end_date,
    deposit_amount, delivery_fee, setup_fee, discount, notes, request_expires_at
  )
  values (
    v_quote.business_id, v_customer_id, 'direct', 'REQUESTED',
    v_quote.start_date, v_quote.end_date, v_quote.deposit_amount,
    v_quote.delivery_fee, v_quote.setup_fee, v_quote.discount, v_quote.notes,
    now() + make_interval(hours => v_business.request_expiry_hours)
  )
  returning * into v_booking;

  insert into public.booking_items (booking_id, item_id, quantity, package_units, daily_price)
  select v_booking.id, item_id, quantity, package_units, daily_price
  from public.quote_items where quote_id = v_quote.id;

  insert into public.booking_packages (booking_id, package_id, quantity, daily_price)
  select v_booking.id, package_id, quantity, daily_price
  from public.quote_packages where quote_id = v_quote.id;

  -- Raises (and rolls everything back) if the items are no longer free.
  perform public._assert_booking_fits(v_booking.id);

  insert into public.booking_events (booking_id, from_status, to_status, note)
  values (v_booking.id, null, 'REQUESTED', 'Customer accepted quote ' || v_quote.reference);

  update public.quotes
  set status = 'ACCEPTED', booking_id = v_booking.id
  where id = v_quote.id;

  return v_booking.reference;
end;
$$;

-- ---------------------------------------------------------------------------
-- The customer's links show packages
-- ---------------------------------------------------------------------------

create or replace function public.get_public_quote(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'reference', q.reference,
    'status', case when q.status = 'OPEN' and q.expires_at < now() then 'EXPIRED'
                   else q.status::text end,
    'customer_name', q.customer_name,
    'customer_phone', q.customer_phone,
    'start_date', q.start_date,
    'end_date', q.end_date,
    'days', q.end_date - q.start_date + 1,
    'delivery_fee', q.delivery_fee,
    'setup_fee', q.setup_fee,
    'discount', q.discount,
    'deposit_amount', q.deposit_amount,
    'total', public.quote_total(q.id),
    'notes', q.notes,
    'expires_at', q.expires_at,
    'business', jsonb_build_object(
      'name', b.name,
      'towns', b.towns,
      'phone', b.phone,
      'whatsapp', b.whatsapp,
      'payment_terms', b.payment_terms,
      'terms', b.terms
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', i.name,
               'quantity', qi.quantity - qi.package_units,
               'daily_price', qi.daily_price,
               'photo_path', i.photo_path
             ) order by i.name)
      from public.quote_items qi join public.items i on i.id = qi.item_id
      where qi.quote_id = q.id and qi.quantity > qi.package_units
    ), '[]'::jsonb),
    'packages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', p.name,
               'quantity', qp.quantity,
               'daily_price', qp.daily_price,
               'contents', public._package_contents(p.id)
             ) order by p.name)
      from public.quote_packages qp join public.packages p on p.id = qp.package_id
      where qp.quote_id = q.id
    ), '[]'::jsonb)
  )
  from public.quotes q
  join public.businesses b on b.id = q.business_id
  where q.public_token = p_token;
$$;

create or replace function public.get_public_booking(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'reference', b.reference,
    'status', b.status,
    'customer_name', c.full_name,
    'start_date', b.start_date,
    'end_date', b.end_date,
    'days', b.end_date - b.start_date + 1,
    'delivery_fee', b.delivery_fee,
    'setup_fee', b.setup_fee,
    'discount', b.discount,
    'deposit_amount', b.deposit_amount,
    'business', jsonb_build_object(
      'name', biz.name,
      'towns', biz.towns,
      'phone', biz.phone,
      'whatsapp', biz.whatsapp,
      'payment_terms', biz.payment_terms,
      'terms', biz.terms
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', i.name, 'quantity', bi.quantity - bi.package_units, 'daily_price', bi.daily_price
             ) order by i.name)
      from public.booking_items bi join public.items i on i.id = bi.item_id
      where bi.booking_id = b.id and bi.quantity > bi.package_units
    ), '[]'::jsonb),
    'packages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', p.name, 'quantity', bp.quantity, 'daily_price', bp.daily_price,
               'contents', public._package_contents(p.id)
             ) order by p.name)
      from public.booking_packages bp join public.packages p on p.id = bp.package_id
      where bp.booking_id = b.id
    ), '[]'::jsonb),
    'balance', (
      select jsonb_build_object(
        'amount_due', bb.amount_due,
        'amount_paid', bb.amount_paid,
        'outstanding', bb.outstanding,
        'deposit_held', bb.deposit_held
      )
      from public.booking_balances bb where bb.booking_id = b.id
    ),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'kind', p.kind, 'amount', p.amount, 'method', p.method,
               'paid_on', p.paid_on, 'note', p.note,
               'customer_confirmed_at', p.customer_confirmed_at
             ) order by p.paid_on, p.created_at)
      from public.payments p
      where p.booking_id = b.id and p.voided_at is null
    ), '[]'::jsonb)
  )
  from public.bookings b
  join public.customers c on c.id = b.customer_id
  join public.businesses biz on biz.id = b.business_id
  where b.public_token = p_token;
$$;

-- ---------------------------------------------------------------------------
-- Row level security and grants
-- ---------------------------------------------------------------------------

alter table public.packages enable row level security;
alter table public.package_items enable row level security;
alter table public.booking_packages enable row level security;
alter table public.quote_packages enable row level security;

-- Read-only to staff; writes go through the functions above.
create policy "members read packages" on public.packages
  for select to authenticated using (public.is_business_member(business_id));
create policy "members read package items" on public.package_items
  for select to authenticated using (
    exists (select 1 from public.packages p
            where p.id = package_id and public.is_business_member(p.business_id))
  );
create policy "members read booking packages" on public.booking_packages
  for select to authenticated using (
    exists (select 1 from public.bookings b
            where b.id = booking_id and public.is_business_member(b.business_id))
  );
create policy "members read quote packages" on public.quote_packages
  for select to authenticated using (
    exists (select 1 from public.quotes q
            where q.id = quote_id and public.is_business_member(q.business_id))
  );

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
grant execute on function public.confirm_public_payment(text, uuid) to anon, authenticated;
grant execute on function public.get_public_handovers(text) to anon, authenticated;
grant execute on function public.respond_public_handover(text, uuid, boolean, text) to anon, authenticated;
revoke execute on function public._package_lines(uuid, jsonb) from authenticated;
revoke execute on function public._expand_package_lines(uuid, jsonb) from authenticated;
revoke execute on function public._package_contents(uuid) from authenticated;
