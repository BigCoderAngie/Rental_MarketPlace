-- Fixes from the code review of 20261023030000_marketplace_requests.sql.
--
-- 1. Internal helpers were still callable through the API (Supabase grants
--    EXECUTE on new functions to anon and authenticated by default), so
--    _owner_contact could reveal an owner's name and phone before the fee was
--    paid (rule 8, FR-PV-01). Only the functions that use them may call them.
-- 2. Each item keeps its own collection town (it was only added to the
--    business's towns, so items showed under the wrong town and address).
-- 3. Gallery photos must sit in the item's own business folder, like the cover.
-- 4. ensure_owner_business: one business even when called twice at once, and
--    staff list into their hire business instead of getting a new one.
-- 5. Requests record when they were answered, and the owner sees how many
--    units are still free on each request's dates.

revoke execute on function public._owner_contact(uuid) from public, anon, authenticated;
revoke execute on function public._free_units(uuid, date, date) from public, anon, authenticated;
revoke execute on function public._request_total(public.listing_requests) from public, anon, authenticated;
revoke execute on function public._request_status(public.listing_requests) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Item town and gallery folder
-- ---------------------------------------------------------------------------

alter table public.items add column town text check (char_length(town) <= 60);
update public.items i set town = b.towns[1] from public.businesses b where b.id = i.business_id and i.town is null;

create function public._paths_in_business(p_paths text[], p_business_id uuid)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select not exists (
    select 1 from unnest(p_paths) as p
    where public.storage_path_business(p) is distinct from p_business_id
  );
$$;
-- Not revoked: the CHECK below runs it as the person saving the item.

alter table public.items
  add constraint items_gallery_in_business check (public._paths_in_business(gallery_paths, business_id));

-- The item's town when it has one, else its business's first town.
create function public._item_town(p_item public.items)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(p_item.town, ''), (select b.towns[1] from public.businesses b where b.id = p_item.business_id));
$$;
revoke execute on function public._item_town(public.items) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- One business per owner
-- ---------------------------------------------------------------------------

create or replace function public.ensure_owner_business()
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

  -- Two calls at once (two quick photo uploads) wait for each other.
  perform pg_advisory_xact_lock(hashtext('ensure_owner_business:' || auth.uid()::text));

  -- Their own business first, else the hire business they work for.
  select bm.business_id into v_id
  from public.business_members bm
  where bm.user_id = auth.uid()
  order by (bm.role = 'owner') desc, bm.created_at
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
-- Answered time
-- ---------------------------------------------------------------------------

alter table public.listing_requests add column answered_at timestamptz;

create or replace function public.cancel_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listing_requests
  set status = 'CANCELLED', answered_at = now()
  where id = p_request_id and renter_id = auth.uid() and status = 'REQUESTED';
  if not found then
    raise exception 'This request can no longer be cancelled';
  end if;
end;
$$;

create or replace function public.decline_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listing_requests
  set status = 'DECLINED', decline_reason = 'owner', answered_at = now()
  where id = p_request_id and status = 'REQUESTED' and public.is_business_owner(business_id);
  if not found then
    raise exception 'This request can no longer be declined';
  end if;
end;
$$;

create or replace function public.accept_and_pay_request(p_request_id uuid)
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

  perform public._assert_booking_fits(v_booking_id);

  v_fee := round(public._request_total(r) * r.fee_rate, 2);
  update public.listing_requests
  set status = 'PAID',
      fee_amount = v_fee,
      paid_at = now(),
      answered_at = now(),
      payment_reference = 'TEST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
      booking_id = v_booking_id
  where id = r.id;

  update public.listing_requests o
  set status = 'DECLINED', decline_reason = 'dates_taken', answered_at = now()
  where o.item_id = r.item_id
    and o.id <> r.id
    and o.status = 'REQUESTED'
    and public._free_units(o.item_id, o.start_date, o.end_date) < o.quantity;

  return jsonb_build_object('fee_amount', v_fee, 'booking_id', v_booking_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Readers: item town, answered time, free units for the owner
-- ---------------------------------------------------------------------------

create or replace function public.get_listing(p_item_id uuid, p_from date default null, p_to date default null)
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
    'town', public._item_town(i),
    'owner_kind', b.kind,
    'owner_since', extract(year from b.created_at)::int,
    'owner_rentals', (select count(*) from public.listing_requests r where r.business_id = b.id and r.status = 'PAID'),
    'free_units', case when p_from is not null and p_to is not null and p_to >= p_from and p_to - p_from <= 90
                       then greatest(public._free_units(i.id, p_from, p_to), 0) end,
    'is_mine', coalesce(public.is_business_member(b.id), false),
    'similar', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'category', s.category, 'category_name', c.name,
        'daily_price', s.daily_price, 'photo_path', s.photo_path, 'town', public._item_town(s), 'area', s.area
      ))
      from (
        select s2.* from public.items s2
        where s2.is_public and not s2.archived and s2.category = i.category and s2.id <> i.id
        order by s2.created_at desc
        limit 3
      ) s
    ), '[]'::jsonb)
  )
  from public.items i
  join public.businesses b on b.id = i.business_id
  join public.categories c on c.slug = i.category
  where i.id = p_item_id and i.is_public and not i.archived;
$$;

create or replace function public.my_requests()
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
      'town', public._item_town(i),
      'start_date', r.start_date,
      'end_date', r.end_date,
      'quantity', r.quantity,
      'total', public._request_total(r),
      'deposit', r.deposit,
      'status', public._request_status(r),
      'decline_reason', r.decline_reason,
      'expires_at', r.expires_at,
      'created_at', r.created_at,
      'answered_at', r.answered_at,
      'paid_at', r.paid_at,
      'owner', case when r.status = 'PAID' then public._owner_contact(r.business_id) end,
      'address', case when r.status = 'PAID' then concat_ws(', ', nullif(i.street_address, ''), nullif(i.area, ''), public._item_town(i)) end
    ) as row
    from public.listing_requests r
    join public.items i on i.id = r.item_id
    where r.renter_id = auth.uid()
  ) rows;
$$;

create or replace function public.owner_requests()
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
      -- Units still free on this request's dates (paid bookings already hold theirs).
      'free_units', case when r.status = 'REQUESTED' then greatest(public._free_units(i.id, r.start_date, r.end_date), 0) end,
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
      'answered_at', r.answered_at,
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

-- search_listings: filter and show by the item's own town.
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
      public._item_town(i) as town,
      case when p_from is null then null else public._free_units(i.id, p_from, p_to) end as free_units
    from public.items i
    join public.categories c on c.slug = i.category
    where i.is_public
      and not i.archived
      and (p_category is null or i.category = p_category)
      and (p_max_price is null or i.daily_price <= p_max_price)
      and (v_town is null or lower(public._item_town(i)) = lower(v_town))
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

-- A draft goes public once it has what renters need (owner dashboard, "Publish").
create function public.publish_listing(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items;
begin
  select * into v_item from public.items where id = p_item_id and not archived;
  if not found or not public.is_business_member(v_item.business_id) then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;
  if v_item.daily_price <= 0 or nullif(trim(v_item.area), '') is null then
    raise exception 'Add a price and the area renters collect from before publishing';
  end if;
  update public.items set is_public = true, listed_at = coalesce(listed_at, now()) where id = p_item_id;
end;
$$;

revoke execute on function public.publish_listing(uuid) from public, anon;
grant execute on function public.publish_listing(uuid) to authenticated;
