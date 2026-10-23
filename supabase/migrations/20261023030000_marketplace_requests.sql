-- The marketplace: item pages, free requests, owner requests with the booking
-- fee, renter bookings and listing an item (build kit Parts 6 to 9,
-- docs/build-kit/02-BUSINESS-RULES.md rules 1 to 22, MASTER-PLAN build kit
-- decisions 1, 2, 9 and 12).
--
-- Privacy until booked (rule 8, FR-PV-01): renters and owners never read each
-- other's rows directly. Every function below returns names, phone numbers
-- and the street address only once the owner has paid the booking fee.
--
-- Payment (decision 2): PayToday is not connected yet, so "Accept and pay"
-- records a TEST payment reference. Swap in the real payment before launch.

-- ---------------------------------------------------------------------------
-- Owners and listing fields
-- ---------------------------------------------------------------------------

-- Every owner lists through a business row, so calendars, stock checks and
-- plans work the same for everyone (decision 9). Individuals get one made for
-- them on their first listing; it is marked so the owner area can hide the
-- hire-business tools.
alter table public.businesses
  add column kind text not null default 'business' check (kind in ('business', 'individual'));

alter table public.items
  add column condition text check (condition in ('new', 'like_new', 'good', 'fair')),
  add column min_days integer not null default 1 check (min_days between 1 and 30),
  -- Shown to renters: suburb or area, for example "Klein Windhoek".
  add column area text check (char_length(area) <= 80),
  -- Private until a booking is paid (rule 9).
  add column street_address text check (char_length(street_address) <= 200),
  -- Up to four more photos after the cover (photo_path).
  add column gallery_paths text[] not null default '{}' check (cardinality(gallery_paths) <= 4),
  add column listed_at timestamptz;

-- The signed-in owner's business: their own, or a new individual one named
-- after them (from the sign-up profile) in their home town.
create function public.ensure_owner_business()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_profile public.profiles;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;

  select bm.business_id into v_id
  from public.business_members bm
  where bm.user_id = auth.uid() and bm.role = 'owner'
  order by bm.created_at
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  select * into v_profile from public.profiles where user_id = auth.uid();
  select email into v_email from auth.users where id = auth.uid();

  insert into public.businesses (name, towns, kind, phone)
  values (
    coalesce(
      case when v_profile.owner_kind = 'business' then nullif(trim(v_profile.business_name), '') end,
      nullif(trim(v_profile.full_name), ''),
      split_part(v_email, '@', 1)
    ),
    case when v_profile.home_town is null or v_profile.home_town = 'Other' then '{}'::text[] else array[v_profile.home_town] end,
    case when v_profile.owner_kind = 'business' then 'business' else 'individual' end,
    v_profile.phone
  )
  returning id into v_id;

  insert into public.business_members (business_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Requests
-- ---------------------------------------------------------------------------

create table public.listing_requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  renter_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  quantity integer not null check (quantity > 0),
  -- Price per unit per day when the request was sent.
  daily_price numeric(12, 2) not null check (daily_price >= 0),
  deposit numeric(12, 2) not null default 0 check (deposit >= 0),
  status text not null default 'REQUESTED'
    check (status in ('REQUESTED', 'PAID', 'DECLINED', 'CANCELLED')),
  -- 'dates_taken' when another renter was accepted for the same dates (rule 11).
  decline_reason text check (decline_reason in ('dates_taken', 'owner')),
  -- Rule 14: unanswered requests expire (24 hours by default).
  expires_at timestamptz not null,
  fee_rate numeric(5, 4) not null check (fee_rate between 0 and 1),
  fee_amount numeric(12, 2),
  paid_at timestamptz,
  payment_reference text,
  booking_id uuid references public.bookings (id) on delete set null,
  -- Rule 4: the owner may claim the fee back within 30 days if the renter cancels or doesn't show.
  refund_claimed_at timestamptz,
  refund_reason text check (char_length(refund_reason) <= 300),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index listing_requests_item_idx on public.listing_requests (item_id, start_date);
create index listing_requests_renter_idx on public.listing_requests (renter_id, created_at desc);
create index listing_requests_business_idx on public.listing_requests (business_id, created_at desc);

-- Nobody reads the table directly: the functions below choose what each side sees.
alter table public.listing_requests enable row level security;
revoke all on public.listing_requests from anon, authenticated;

create function public._request_total(r public.listing_requests)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select r.daily_price * r.quantity * (r.end_date - r.start_date + 1);
$$;

-- REQUESTED past its expiry reads as EXPIRED.
create function public._request_status(r public.listing_requests)
returns text
language sql
stable
set search_path = ''
as $$
  select case when r.status = 'REQUESTED' and r.expires_at <= now() then 'EXPIRED' else r.status end;
$$;

-- Units of an item free on every day from p_from to p_to (plus turnaround).
create function public._free_units(p_item_id uuid, p_from date, p_to date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (i.quantity_owned - i.units_out_of_service) - coalesce((
    select max(bu.booked) from public._booked_units(array[i.id], p_from, p_to + i.turnaround_days) bu
  ), 0)
  from public.items i
  where i.id = p_item_id;
$$;

-- The owner's name and phone for a renter, once paid: an individual's own
-- name and number, or the hire business's.
create function public._owner_contact(p_business_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', case when b.kind = 'individual' then coalesce(p.full_name, b.name) else b.name end,
    'phone', coalesce(nullif(b.whatsapp, ''), nullif(b.phone, ''), p.phone)
  )
  from public.businesses b
  left join public.business_members bm on bm.business_id = b.id and bm.role = 'owner'
  left join public.profiles p on p.user_id = bm.user_id
  where b.id = p_business_id
  order by bm.created_at
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Item page (Part 6)
-- ---------------------------------------------------------------------------

-- What anyone may see about a public item, with free units for the dates
-- asked and three similar items. Never the owner's name or street address.
create function public.get_listing(p_item_id uuid, p_from date default null, p_to date default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', i.id,
    'name', i.name,
    'category', i.category,
    'category_name', c.name,
    'description', i.description,
    'condition', i.condition,
    'daily_price', i.daily_price,
    'deposit', i.deposit,
    'min_days', i.min_days,
    'in_service', i.quantity_owned - i.units_out_of_service,
    'photo_path', i.photo_path,
    'gallery_paths', i.gallery_paths,
    'area', i.area,
    'town', b.towns[1],
    'owner_kind', b.kind,
    'owner_since', extract(year from b.created_at)::int,
    'owner_rentals', (select count(*) from public.listing_requests r where r.business_id = b.id and r.status = 'PAID'),
    'free_units', case when p_from is not null and p_to is not null and p_to >= p_from and p_to - p_from <= 90
                       then greatest(public._free_units(i.id, p_from, p_to), 0) end,
    'is_mine', coalesce(public.is_business_member(b.id), false),
    'similar', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'category', s.category, 'category_name', c.name,
        'daily_price', s.daily_price, 'photo_path', s.photo_path, 'town', sb.towns[1], 'area', s.area
      ))
      from (
        select s2.* from public.items s2
        where s2.is_public and not s2.archived and s2.category = i.category and s2.id <> i.id
        order by s2.created_at desc
        limit 3
      ) s
      join public.businesses sb on sb.id = s.business_id
    ), '[]'::jsonb)
  )
  from public.items i
  join public.businesses b on b.id = i.business_id
  join public.categories c on c.slug = i.category
  where i.id = p_item_id and i.is_public and not i.archived;
$$;

-- Rule 1 and 14: a free request. The renter pays nothing; it waits for the
-- owner for the business's expiry hours (24 by default).
create function public.send_request(p_item_id uuid, p_from date, p_to date, p_quantity integer default 1)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items;
  v_business public.businesses;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;

  select * into v_item from public.items where id = p_item_id and is_public and not archived;
  if not found then
    raise exception 'This item is no longer listed' using errcode = 'P0002';
  end if;
  select * into v_business from public.businesses where id = v_item.business_id;

  if public.is_business_member(v_business.id) then
    raise exception 'This is your own item';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Choose your dates';
  end if;
  if p_from < public.namibia_today() then
    raise exception 'Choose dates from today on';
  end if;
  if p_to - p_from > 90 then
    raise exception 'Choose at most 90 days';
  end if;
  if p_to - p_from + 1 < v_item.min_days then
    raise exception 'This item rents for at least % days', v_item.min_days;
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > v_item.quantity_owned - v_item.units_out_of_service then
    raise exception 'Choose how many, up to %', v_item.quantity_owned - v_item.units_out_of_service;
  end if;
  if public._free_units(v_item.id, p_from, p_to) < p_quantity then
    raise exception 'Not free on these dates. Try other dates.';
  end if;
  if not exists (select 1 from public.profiles where user_id = auth.uid() and nullif(trim(phone), '') is not null) then
    raise exception 'Add your mobile number first, so the owner can reach you once they accept.';
  end if;
  if exists (
    select 1 from public.listing_requests r
    where r.item_id = v_item.id and r.renter_id = auth.uid()
      and r.status = 'REQUESTED' and r.expires_at > now()
      and r.start_date <= p_to and r.end_date >= p_from
  ) then
    raise exception 'You already asked for this item on these dates';
  end if;

  insert into public.listing_requests (
    item_id, business_id, renter_id, start_date, end_date, quantity,
    daily_price, deposit, expires_at, fee_rate
  )
  values (
    v_item.id, v_business.id, auth.uid(), p_from, p_to, p_quantity,
    v_item.daily_price, v_item.deposit * p_quantity,
    now() + make_interval(hours => v_business.request_expiry_hours),
    (public.business_plan(v_business.id)).booking_fee_rate
  )
  returning id into v_id;

  return v_id;
end;
$$;

create function public.cancel_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listing_requests
  set status = 'CANCELLED'
  where id = p_request_id and renter_id = auth.uid() and status = 'REQUESTED';
  if not found then
    raise exception 'This request can no longer be cancelled';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Renter bookings (Part 7)
-- ---------------------------------------------------------------------------

create function public.my_requests()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(row order by (row ->> 'created_at') desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', r.id,
      'item_id', i.id,
      'item_name', i.name,
      'category', i.category,
      'photo_path', i.photo_path,
      'area', i.area,
      'town', b.towns[1],
      'start_date', r.start_date,
      'end_date', r.end_date,
      'quantity', r.quantity,
      'total', public._request_total(r),
      'deposit', r.deposit,
      'status', public._request_status(r),
      'decline_reason', r.decline_reason,
      'expires_at', r.expires_at,
      'created_at', r.created_at,
      'paid_at', r.paid_at,
      -- Unlocked only once the owner has paid (rule 9).
      'owner', case when r.status = 'PAID' then public._owner_contact(b.id) end,
      'address', case when r.status = 'PAID' then concat_ws(', ', nullif(i.street_address, ''), nullif(i.area, ''), b.towns[1]) end
    ) as row
    from public.listing_requests r
    join public.items i on i.id = r.item_id
    join public.businesses b on b.id = r.business_id
    where r.renter_id = auth.uid()
  ) rows;
$$;

-- ---------------------------------------------------------------------------
-- Owner requests and the booking fee (Part 8)
-- ---------------------------------------------------------------------------

-- Requests for the signed-in owner's items. Renters show as Renter A, B, C
-- (in the order they asked for that item) with their number of paid rentals;
-- their name and phone only after the fee is paid.
create function public.owner_requests()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(row order by (row ->> 'created_at') desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', r.id,
      'item_id', i.id,
      'item_name', i.name,
      'photo_path', i.photo_path,
      'in_service', i.quantity_owned - i.units_out_of_service,
      -- A for the first renter who asked for this item, B for the next, and so on.
      'label', 'Renter ' || chr(64 + least(26, (
        select count(*) from (
          select r2.renter_id, min(r2.created_at) as first_at
          from public.listing_requests r2
          where r2.item_id = r.item_id
          group by r2.renter_id
        ) f
        where (f.first_at, f.renter_id) <= (
          (select min(r3.created_at) from public.listing_requests r3
           where r3.item_id = r.item_id and r3.renter_id = r.renter_id),
          r.renter_id
        )
      )::int)),
      'renter_rentals', (select count(*) from public.listing_requests r4 where r4.renter_id = r.renter_id and r4.status = 'PAID'),
      'start_date', r.start_date,
      'end_date', r.end_date,
      'quantity', r.quantity,
      'daily_price', r.daily_price,
      'total', public._request_total(r),
      'deposit', r.deposit,
      'fee_rate', r.fee_rate,
      'fee_amount', coalesce(r.fee_amount, round(public._request_total(r) * r.fee_rate, 2)),
      'status', public._request_status(r),
      'decline_reason', r.decline_reason,
      'expires_at', r.expires_at,
      'created_at', r.created_at,
      'paid_at', r.paid_at,
      'payment_reference', r.payment_reference,
      'refund_claimed_at', r.refund_claimed_at,
      'renter', case when r.status = 'PAID' then (
        select jsonb_build_object('name', coalesce(p.full_name, 'Renter'), 'phone', p.phone)
        from public.profiles p where p.user_id = r.renter_id
      ) end
    ) as row
    from public.listing_requests r
    join public.items i on i.id = r.item_id
    where public.is_business_member(r.business_id)
  ) rows;
$$;

-- Accept and pay (rule 3, 9, 11, 13). Records the TEST payment, puts the
-- units on hold with a confirmed booking (so the calendar and search see
-- them), unlocks both sides, and declines other open requests for the item
-- that no longer fit.
create function public.accept_and_pay_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.listing_requests;
  v_profile public.profiles;
  v_customer_id uuid;
  v_booking_id uuid;
  v_fee numeric;
begin
  select * into r from public.listing_requests where id = p_request_id for update;
  if not found or not public.is_business_owner(r.business_id) then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if public._request_status(r) <> 'REQUESTED' then
    raise exception 'This request is no longer waiting (%)', lower(public._request_status(r));
  end if;

  select * into v_profile from public.profiles where user_id = r.renter_id;

  insert into public.customers (business_id, full_name, phone)
  values (r.business_id, coalesce(nullif(trim(v_profile.full_name), ''), 'RentLoop renter'), coalesce(nullif(trim(v_profile.phone), ''), 'not given'))
  on conflict (business_id, phone) do update set full_name = excluded.full_name
  returning id into v_customer_id;

  insert into public.bookings (business_id, customer_id, source, status, start_date, end_date, deposit_amount, notes, created_by)
  values (r.business_id, v_customer_id, 'marketplace', 'CONFIRMED', r.start_date, r.end_date, r.deposit, 'From a RentLoop marketplace request', auth.uid())
  returning id into v_booking_id;

  insert into public.booking_items (booking_id, item_id, quantity, daily_price)
  values (v_booking_id, r.item_id, r.quantity, r.daily_price);

  -- Raises "Not enough ..." if another booking took the units meanwhile.
  perform public._assert_booking_fits(v_booking_id);

  v_fee := round(public._request_total(r) * r.fee_rate, 2);
  update public.listing_requests
  set status = 'PAID',
      fee_amount = v_fee,
      paid_at = now(),
      payment_reference = 'TEST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
      booking_id = v_booking_id
  where id = r.id;

  -- Same dates, not enough left: the others are told the dates are taken.
  update public.listing_requests o
  set status = 'DECLINED', decline_reason = 'dates_taken'
  where o.item_id = r.item_id
    and o.id <> r.id
    and o.status = 'REQUESTED'
    and public._free_units(o.item_id, o.start_date, o.end_date) < o.quantity;

  return jsonb_build_object('fee_amount', v_fee, 'booking_id', v_booking_id);
end;
$$;

create function public.decline_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listing_requests
  set status = 'DECLINED', decline_reason = 'owner'
  where id = p_request_id and status = 'REQUESTED' and public.is_business_owner(business_id);
  if not found then
    raise exception 'This request can no longer be declined';
  end if;
end;
$$;

-- Rule 4: within 30 days of the start date, when the renter cancelled or didn't show.
create function public.claim_fee_refund(p_request_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listing_requests
  set refund_claimed_at = now(), refund_reason = left(trim(p_reason), 300)
  where id = p_request_id
    and status = 'PAID'
    and refund_claimed_at is null
    and public.is_business_owner(business_id)
    and public.namibia_today() <= start_date + 30;
  if not found then
    raise exception 'A refund can be claimed once, within 30 days of the start date';
  end if;
end;
$$;

-- The owner dashboard numbers (SiteOwner.html): this month, six months of
-- money recorded, bookings and listings.
create function public.owner_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select b.id, b.kind from public.businesses b where public.is_business_member(b.id)
  ),
  paid as (
    select r.*, public._request_total(r) as total
    from public.listing_requests r
    where r.business_id in (select id from mine) and r.status = 'PAID'
  )
  select jsonb_build_object(
    'kind', (select kind from mine order by kind limit 1),
    'month_total', coalesce((select sum(total) from paid where date_trunc('month', paid_at) = date_trunc('month', now())), 0),
    'month_bookings', (select count(*) from paid where date_trunc('month', paid_at) = date_trunc('month', now())),
    'active_listings', (select count(*) from public.items i where i.business_id in (select id from mine) and i.is_public and not i.archived),
    'waiting_requests', (
      select count(*) from public.listing_requests r
      where r.business_id in (select id from mine) and r.status = 'REQUESTED' and r.expires_at > now()
    ),
    'months', (
      select jsonb_agg(jsonb_build_object(
        'month', to_char(m, 'YYYY-MM'),
        'total', coalesce((select sum(total) from paid where date_trunc('month', paid_at) = m), 0)
      ) order by m)
      from generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') as m
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Search shows the area as well as the town
-- ---------------------------------------------------------------------------

-- Replaces the version in 20261023020000_explore_search.sql: adds 'area'.
create or replace function public.search_listings(
  p_q text default null,
  p_town text default null,
  p_from date default null,
  p_to date default null,
  p_category text default null,
  p_max_price numeric default null,
  p_only_free boolean default false,
  p_sort text default 'recommended',
  p_limit integer default 12,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(replace(replace(replace(trim(p_q), '\', '\\'), '%', '\%'), '_', '\_'), '');
  v_town text := nullif(trim(p_town), '');
  v_limit integer := least(greatest(coalesce(p_limit, 12), 1), 48);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if (p_from is null) <> (p_to is null) then
    raise exception 'Choose both dates';
  end if;
  if p_to < p_from or p_to - p_from > 90 then
    raise exception 'Choose dates at most 90 days apart';
  end if;

  with matches as (
    select
      i.id, i.name, i.category, c.name as category_name, i.daily_price, i.deposit,
      i.photo_path, i.created_at, i.area,
      coalesce(
        (select t from unnest(b.towns) as t where lower(t) = lower(v_town) limit 1),
        b.towns[1]
      ) as town,
      case when p_from is null then null else public._free_units(i.id, p_from, p_to) end as free_units
    from public.items i
    join public.businesses b on b.id = i.business_id
    join public.categories c on c.slug = i.category
    where i.is_public
      and not i.archived
      and (p_category is null or i.category = p_category)
      and (p_max_price is null or i.daily_price <= p_max_price)
      and (v_town is null or exists (select 1 from unnest(b.towns) as t where lower(t) = lower(v_town)))
      and (v_q is null
           or i.name ilike '%' || v_q || '%'
           or i.description ilike '%' || v_q || '%'
           or c.name ilike '%' || v_q || '%'
           or i.area ilike '%' || v_q || '%')
  ),
  kept as (
    select * from matches
    where not (p_only_free and coalesce(free_units, 0) < 1)
  )
  select jsonb_build_object(
    'total', (select count(*) from kept),
    'items', coalesce((
      select jsonb_agg(to_jsonb(page) - 'ord' order by page.ord)
      from (
        select k.id, k.name, k.category, k.category_name, k.daily_price, k.deposit,
               k.photo_path, k.town, k.area,
               case when k.free_units is not null then greatest(k.free_units, 0) end as free_units,
               row_number() over (order by
                 case when p_sort = 'price_asc' then k.daily_price end asc nulls last,
                 case when p_sort = 'price_desc' then k.daily_price end desc nulls last,
                 case when p_sort = 'recommended' then (coalesce(k.free_units, 1) > 0) end desc nulls last,
                 k.created_at desc,
                 k.id
               ) as ord
        from kept k
        order by ord
        limit v_limit offset v_offset
      ) page
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------

revoke execute on function public.ensure_owner_business() from public;
revoke execute on function public._request_total(public.listing_requests) from public;
revoke execute on function public._request_status(public.listing_requests) from public;
revoke execute on function public._free_units(uuid, date, date) from public;
revoke execute on function public._owner_contact(uuid) from public;
revoke execute on function public.get_listing(uuid, date, date) from public;
revoke execute on function public.send_request(uuid, date, date, integer) from public;
revoke execute on function public.cancel_request(uuid) from public;
revoke execute on function public.my_requests() from public;
revoke execute on function public.owner_requests() from public;
revoke execute on function public.accept_and_pay_request(uuid) from public;
revoke execute on function public.decline_request(uuid) from public;
revoke execute on function public.claim_fee_refund(uuid, text) from public;
revoke execute on function public.owner_summary() from public;

grant execute on function public.get_listing(uuid, date, date) to anon, authenticated;
grant execute on function public.ensure_owner_business() to authenticated;
grant execute on function public.send_request(uuid, date, date, integer) to authenticated;
grant execute on function public.cancel_request(uuid) to authenticated;
grant execute on function public.my_requests() to authenticated;
grant execute on function public.owner_requests() to authenticated;
grant execute on function public.accept_and_pay_request(uuid) to authenticated;
grant execute on function public.decline_request(uuid) to authenticated;
grant execute on function public.claim_fee_refund(uuid, text) to authenticated;
grant execute on function public.owner_summary() to authenticated;
