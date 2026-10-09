-- Checkout and return records (SRS 5.8, FR-CR-01 to FR-CR-06).
--
--   * At checkout staff record how many of each item were handed over, add
--     condition photos and tick that the customer's ID matches the booking
--     name. The ID itself is never stored (FR-CR-03).
--   * At return staff record, per item, how many came back fine, damaged or
--     missing, with photos. A return after the end date is flagged late.
--   * The customer confirms or disputes each record from their booking link
--     (or on the staff member's phone, which opens the same link). Disputing
--     a return opens a problem on the booking (FR-CR-05).
--   * Recording a checkout moves the booking to CHECKED_OUT and a return to
--     RETURNED straight away; the customer's confirmation is kept alongside,
--     timestamped, so staff are never blocked waiting for it.
--   * Photos live in a private storage bucket, in a folder per business, and
--     are uploaded from the phone straight to storage (not through the
--     website), so large photos are no problem.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create type public.handover_kind as enum ('CHECKOUT', 'RETURN');

create table public.handovers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind public.handover_kind not null,
  id_checked boolean not null default false,
  late boolean not null default false,
  note text,
  recorded_by uuid references auth.users (id),
  recorded_at timestamptz not null default now(),
  customer_confirmed_at timestamptz,
  customer_disputed_at timestamptz,
  dispute_note text,
  unique (booking_id, kind),
  check (customer_confirmed_at is null or customer_disputed_at is null)
);

create table public.handover_lines (
  handover_id uuid not null references public.handovers (id) on delete cascade,
  item_id uuid not null references public.items (id),
  -- Checkout: units handed over. Return: units back in good condition.
  quantity integer not null check (quantity >= 0),
  damaged integer not null default 0 check (damaged >= 0),
  missing integer not null default 0 check (missing >= 0),
  primary key (handover_id, item_id)
);

create table public.handover_photos (
  id uuid primary key default gen_random_uuid(),
  handover_id uuid not null references public.handovers (id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Photo storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('handover-photos', 'handover-photos', false)
on conflict (id) do nothing;

-- Paths are <business id>/<booking id>/<file>; only that business's members
-- can upload or view them.
create function public.storage_path_business(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
  end;
$$;

create policy "members upload handover photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'handover-photos'
    and public.is_business_member(public.storage_path_business(name))
  );

create policy "members view handover photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'handover-photos'
    and public.is_business_member(public.storage_path_business(name))
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Saves photo paths already uploaded to storage under this booking's folder.
create function public._attach_handover_photos(p_handover public.handovers, p_paths text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text := p_handover.business_id || '/' || p_handover.booking_id || '/';
begin
  if exists (select 1 from unnest(coalesce(p_paths, '{}')) p where left(p, length(v_prefix)) <> v_prefix) then
    raise exception 'Photos must be uploaded to this booking''s folder';
  end if;

  insert into public.handover_photos (handover_id, storage_path)
  select p_handover.id, p from unnest(coalesce(p_paths, '{}')) p
  on conflict (storage_path) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff API
-- ---------------------------------------------------------------------------

-- FR-CR-01 / FR-CR-03: record the handover. p_lines is
-- [{"item_id": "...", "quantity": 10}] and may not exceed what was booked.
create function public.record_checkout(
  p_booking_id uuid,
  p_lines jsonb,
  p_id_checked boolean,
  p_photo_paths text[] default '{}',
  p_note text default null
)
returns public.handovers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_handover public.handovers;
  v_over record;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found or not public.is_business_member(v_booking.business_id) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  -- Checks section 4.2 (only a CONFIRMED booking can be checked out) and locks it.
  perform public._move_booking(p_booking_id, 'CHECKED_OUT', 'Checked out');

  insert into public.handovers (booking_id, business_id, kind, id_checked, note, recorded_by)
  values (p_booking_id, v_booking.business_id, 'CHECKOUT', coalesce(p_id_checked, false),
          nullif(trim(p_note), ''), auth.uid())
  returning * into v_handover;

  insert into public.handover_lines (handover_id, item_id, quantity)
  select v_handover.id, bi.item_id,
         coalesce((select (l ->> 'quantity')::integer
                   from jsonb_array_elements(coalesce(p_lines, '[]')) l
                   where (l ->> 'item_id')::uuid = bi.item_id), 0)
  from public.booking_items bi
  where bi.booking_id = p_booking_id;

  select i.name, hl.quantity, bi.quantity as booked into v_over
  from public.handover_lines hl
  join public.booking_items bi on bi.booking_id = p_booking_id and bi.item_id = hl.item_id
  join public.items i on i.id = hl.item_id
  where hl.handover_id = v_handover.id and hl.quantity > bi.quantity
  limit 1;
  if found then
    raise exception 'Only % "%" were booked, not %', v_over.booked, v_over.name, v_over.quantity;
  end if;

  if not exists (select 1 from public.handover_lines where handover_id = v_handover.id and quantity > 0) then
    raise exception 'Enter how many of each item were handed over';
  end if;

  perform public._attach_handover_photos(v_handover, p_photo_paths);
  return v_handover;
end;
$$;

-- FR-CR-04: record what came back. p_lines is
-- [{"item_id": "...", "quantity": 8, "damaged": 1, "missing": 1}]; for each
-- item the three must add up to what was handed over at checkout.
create function public.record_return(
  p_booking_id uuid,
  p_lines jsonb,
  p_photo_paths text[] default '{}',
  p_note text default null
)
returns public.handovers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_checkout public.handovers;
  v_handover public.handovers;
  v_bad record;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found or not public.is_business_member(v_booking.business_id) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  select * into v_checkout from public.handovers where booking_id = p_booking_id and kind = 'CHECKOUT';
  if not found then
    raise exception 'Record the checkout before the return';
  end if;

  -- Checks section 4.2 (CHECKED_OUT or OVERDUE) and locks the booking.
  perform public._move_booking(p_booking_id, 'RETURNED', 'Returned');

  insert into public.handovers (booking_id, business_id, kind, late, note, recorded_by)
  values (p_booking_id, v_booking.business_id, 'RETURN',
          public.namibia_today() > v_booking.end_date, nullif(trim(p_note), ''), auth.uid())
  returning * into v_handover;

  insert into public.handover_lines (handover_id, item_id, quantity, damaged, missing)
  select v_handover.id, out_line.item_id,
         coalesce((l ->> 'quantity')::integer, 0),
         coalesce((l ->> 'damaged')::integer, 0),
         coalesce((l ->> 'missing')::integer, 0)
  from public.handover_lines out_line
  left join lateral (
    select l from jsonb_array_elements(coalesce(p_lines, '[]')) l
    where (l ->> 'item_id')::uuid = out_line.item_id
  ) x on true
  where out_line.handover_id = v_checkout.id;

  select i.name, r.quantity + r.damaged + r.missing as counted, o.quantity as handed_over into v_bad
  from public.handover_lines r
  join public.handover_lines o on o.handover_id = v_checkout.id and o.item_id = r.item_id
  join public.items i on i.id = r.item_id
  where r.handover_id = v_handover.id and r.quantity + r.damaged + r.missing <> o.quantity
  limit 1;
  if found then
    raise exception '% "%" went out but % are counted; fine, damaged and missing must add up',
      v_bad.handed_over, v_bad.name, v_bad.counted;
  end if;

  perform public._attach_handover_photos(v_handover, p_photo_paths);
  return v_handover;
end;
$$;

-- Checkout and return now need a record with counts, and OVERDUE and EXPIRED
-- are set by the system, so the plain status change refuses them.
create or replace function public.set_booking_status(
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
  if p_to in ('CHECKED_OUT', 'RETURNED') then
    raise exception 'Record the checkout or return with its item counts';
  end if;
  if p_to in ('OVERDUE', 'EXPIRED') then
    raise exception 'A booking becomes % automatically', lower(p_to::text);
  end if;
  return public._move_booking(p_booking_id, p_to, p_note);
end;
$$;

-- FR-CR-06: flag bookings whose return date has passed without a return.
-- Safe to run any time; run it daily from a scheduler.
create function public.mark_overdue_bookings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.bookings
    where status = 'CHECKED_OUT' and end_date < public.namibia_today()
    for update skip locked
  loop
    update public.bookings set status = 'OVERDUE', updated_at = now() where id = v_id;
    insert into public.booking_events (booking_id, from_status, to_status, note)
    values (v_id, 'CHECKED_OUT', 'OVERDUE', 'Return date passed');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Run it every night at 00:05 Namibian time (22:05 UTC) where pg_cron is
-- available, as it is on Supabase.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron';
    execute $cron$select cron.schedule('mark-overdue-bookings', '5 22 * * *',
                                       'select public.mark_overdue_bookings()')$cron$;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public API (the customer's booking link)
-- ---------------------------------------------------------------------------

-- The checkout and return records for the customer's booking page.
create function public.get_public_handovers(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', h.id,
    'kind', h.kind,
    'recorded_at', h.recorded_at,
    'late', h.late,
    'note', h.note,
    'photo_count', (select count(*) from public.handover_photos p where p.handover_id = h.id),
    'customer_confirmed_at', h.customer_confirmed_at,
    'customer_disputed_at', h.customer_disputed_at,
    'dispute_note', h.dispute_note,
    'lines', (
      select jsonb_agg(jsonb_build_object(
               'name', i.name, 'quantity', hl.quantity,
               'damaged', hl.damaged, 'missing', hl.missing
             ) order by i.name)
      from public.handover_lines hl join public.items i on i.id = hl.item_id
      where hl.handover_id = h.id
    )
  ) order by h.recorded_at, h.kind), '[]'::jsonb)
  from public.handovers h
  join public.bookings b on b.id = h.booking_id
  where b.public_token = p_token;
$$;

-- FR-CR-02 / FR-CR-05: the customer agrees with a record, or disputes it with
-- a note. Disputing a return opens a problem on the booking.
create function public.respond_public_handover(
  p_token text,
  p_handover_id uuid,
  p_agree boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_handover public.handovers;
  v_booking public.bookings;
begin
  select h.* into v_handover
  from public.handovers h
  join public.bookings b on b.id = h.booking_id
  where h.id = p_handover_id and b.public_token = p_token
  for update of h;

  if not found then
    raise exception 'Record not found' using errcode = 'P0002';
  end if;
  if v_handover.customer_confirmed_at is not null or v_handover.customer_disputed_at is not null then
    raise exception 'You have already responded to this record';
  end if;

  if p_agree then
    update public.handovers set customer_confirmed_at = now() where id = p_handover_id;
    return;
  end if;

  if coalesce(trim(p_note), '') = '' then
    raise exception 'Say what is wrong so the business can sort it out';
  end if;

  update public.handovers
  set customer_disputed_at = now(), dispute_note = trim(p_note)
  where id = p_handover_id;

  select * into v_booking from public.bookings where id = v_handover.booking_id for update;
  if v_handover.kind = 'RETURN' and v_booking.status = 'RETURNED' then
    update public.bookings set status = 'PROBLEM_OPEN', updated_at = now() where id = v_booking.id;
    insert into public.booking_events (booking_id, from_status, to_status, note)
    values (v_booking.id, 'RETURNED', 'PROBLEM_OPEN', 'Customer disputed the return: ' || trim(p_note));
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security and grants
-- ---------------------------------------------------------------------------

alter table public.handovers enable row level security;
alter table public.handover_lines enable row level security;
alter table public.handover_photos enable row level security;

-- Read-only to staff; writes go through the functions above.
create policy "members read handovers" on public.handovers
  for select to authenticated using (public.is_business_member(business_id));
create policy "members read handover lines" on public.handover_lines
  for select to authenticated using (
    exists (select 1 from public.handovers h
            where h.id = handover_id and public.is_business_member(h.business_id))
  );
create policy "members read handover photos" on public.handover_photos
  for select to authenticated using (
    exists (select 1 from public.handovers h
            where h.id = handover_id and public.is_business_member(h.business_id))
  );

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
grant execute on function public.confirm_public_payment(text, uuid) to anon, authenticated;
grant execute on function public.get_public_handovers(text) to anon, authenticated;
grant execute on function public.respond_public_handover(text, uuid, boolean, text) to anon, authenticated;
revoke execute on function public._attach_handover_photos(public.handovers, text[]) from authenticated;
revoke execute on function public.mark_overdue_bookings() from authenticated;
