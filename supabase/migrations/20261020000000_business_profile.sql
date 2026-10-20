-- Business profile and account states (contract C1 in docs/TASKS.md).
--
-- FR-AC-02: a business gets a logo, opening hours, a BIPA number and the
-- details customers use to pay it ("How customers pay you"). RentLoop never
-- handles that money (SRS 2.4); the details are text the business writes.
-- FR-PY-03: customers see those details on their quote and booking links,
-- only through get_public_quote and get_public_booking. Signed-out visitors
-- still can't read the businesses table.
-- FR-AC-05: every user gets a profile with a phone number and one of the six
-- account states. This migration uses NEW and ACTIVE. SUSPENDED and CLOSED are
-- set and enforced by the admin tools (db-admin, wave 10); PHONE_VERIFIED and
-- UNDER_REVIEW wait for phone login and Phase 2 verification.

-- ---------------------------------------------------------------------------
-- Business profile fields
-- ---------------------------------------------------------------------------

alter table public.businesses
  -- Exactly <business id>/<file name>: no sub-folders, no "..".
  add column logo_path text
    check (logo_path is null or logo_path ~ ('^' || id::text || '/[A-Za-z0-9._-]+$')),
  add column opening_hours text check (char_length(opening_hours) <= 120),
  add column bipa_number text check (char_length(bipa_number) <= 40),
  add column payment_details text check (char_length(payment_details) <= 1000);

-- Signed-out visitors never read this table; the customer links get what they
-- need through the security definer functions below.
revoke all on public.businesses from anon;

-- Logos live in a public bucket so customer links can show them without
-- signing in. Paths start with the business id (<business id>/logo.<ext>);
-- only the owner can add, replace or remove the logo.
-- Images only, up to 2 MB: a public bucket must not serve scripts or large files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-logos', 'business-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "owners upload business logos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'business-logos'
    and public.is_business_owner(public.storage_path_business(name))
  );

create policy "owners replace business logos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'business-logos'
    and public.is_business_owner(public.storage_path_business(name))
  )
  with check (
    bucket_id = 'business-logos'
    and public.is_business_owner(public.storage_path_business(name))
  );

create policy "owners delete business logos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'business-logos'
    and public.is_business_owner(public.storage_path_business(name))
  );

-- Anyone can view through the public URL; replacing or removing a file
-- through the API also needs read access.
create policy "members view business logos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'business-logos'
    and public.is_business_member(public.storage_path_business(name))
  );

-- ---------------------------------------------------------------------------
-- Profiles: phone number and account state
-- ---------------------------------------------------------------------------

create type public.account_state as enum (
  'NEW', 'PHONE_VERIFIED', 'ACTIVE', 'UNDER_REVIEW', 'SUSPENDED', 'CLOSED'
);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  account_state public.account_state not null default 'NEW',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users read only their own profile. Nobody writes to it directly: the
-- sign-up trigger creates it and set_my_phone changes it.
create policy "users read their own profile" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- Every new sign-up gets a profile.
create function public._create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public._create_profile();

-- Users who signed up before this migration get one too.
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Saves the signed-in user's phone number and makes a NEW account ACTIVE.
create function public.set_my_phone(p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := trim(p_phone);
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if v_phone is null or v_phone !~ '^\+?[0-9 ()-]{8,20}$'
     or length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 8 then
    raise exception 'Enter a phone number, for example 081 123 4567';
  end if;

  insert into public.profiles (user_id, phone, account_state)
  values (auth.uid(), v_phone, 'ACTIVE')
  on conflict (user_id) do update
    set phone = excluded.phone,
        account_state = case when public.profiles.account_state = 'NEW' then 'ACTIVE'::public.account_state
                             else public.profiles.account_state end;
end;
$$;

-- ---------------------------------------------------------------------------
-- The customer's links show the logo and how to pay the business
-- ---------------------------------------------------------------------------

-- What a customer's quote or booking link shows about the business. One place
-- for these fields, used by both functions below.
create function public._public_business(p_business_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', b.name,
    'towns', b.towns,
    'phone', b.phone,
    'whatsapp', b.whatsapp,
    'payment_terms', b.payment_terms,
    'terms', b.terms,
    'logo_path', b.logo_path,
    'payment_details', b.payment_details
  )
  from public.businesses b
  where b.id = p_business_id;
$$;

-- get_public_quote and get_public_booking are copies of the definitions in
-- 20261010300000_packages.sql, with 'business' from _public_business.

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
    'business', public._public_business(q.business_id),
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
    'business', public._public_business(b.business_id),
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
  where b.public_token = p_token;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function public._create_profile() from public, anon, authenticated;
revoke execute on function public._public_business(uuid) from public, anon, authenticated;
revoke execute on function public.set_my_phone(text) from public, anon;
grant execute on function public.set_my_phone(text) to authenticated;
-- create or replace keeps these, but say it again so the file reads on its own.
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
