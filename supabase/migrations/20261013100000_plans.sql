-- Plans: Free, Pro and Business (SRS 3.2 and 5.14, FR-PL-01 to FR-PL-05).
--
--   * Every business starts on Free. A paid plan runs 12 months from the day
--     an admin approves the business's proof of payment (bank deposit or
--     eWallet). When it ends the business is back on Free; nothing is deleted.
--   * The plan sets the item and user limits and whether full reports and
--     CSV downloads are included. Its marketplace fee rate is stored for
--     Phase 2.
--   * Prices and limits live in the plans table and are admin settings. The
--     numbers below are placeholders until the business interviews confirm
--     them. Businesses that join before the launch ends pay the founding
--     price during their first year.
--   * The platform only collects its own subscription money; rental money
--     never passes through it.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.plans (
  code text primary key check (code in ('free', 'pro', 'business')),
  name text not null,
  yearly_price numeric(12, 2) not null check (yearly_price >= 0),
  founding_price numeric(12, 2) not null check (founding_price >= 0),
  item_limit integer check (item_limit > 0),        -- null means unlimited
  user_limit integer check (user_limit > 0),        -- null means unlimited
  booking_fee_rate numeric(5, 4) not null check (booking_fee_rate between 0 and 1),
  full_reports boolean not null default false,
  sort_order integer not null default 0
);

-- Placeholder prices (N$ a year). Founding prices are the SRS launch prices.
insert into public.plans
  (code, name, yearly_price, founding_price, item_limit, user_limit, booking_fee_rate, full_reports, sort_order)
values
  ('free', 'Free', 0, 0, 15, 1, 0.10, false, 1),
  ('pro', 'Pro', 299, 199, 100, 3, 0.05, true, 2),
  ('business', 'Business', 699, 499, null, null, 0, true, 3);

-- One row of platform-wide settings, edited by admins.
create table public.platform_settings (
  id boolean primary key default true check (id),
  -- Businesses created on or before this day get founding prices for a year.
  launch_ends_on date not null default '2027-03-31',
  seller_name text not null default 'Namibia Rental Platform (placeholder)',
  seller_address text not null default 'Windhoek, Namibia',
  seller_vat_number text,
  bank_details text not null default 'Bank: (placeholder) · Account name: (placeholder) · Account number: (placeholder) · Branch code: (placeholder)',
  ewallet_details text not null default 'eWallet number: (placeholder)'
);
insert into public.platform_settings default values;

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- The business's current plan. Members can read it; only the functions
-- below change it.
create table public.subscriptions (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  plan_code text not null default 'free' references public.plans (code),
  expires_at timestamptz,
  founding_until date,
  check ((plan_code = 'free') = (expires_at is null))
);

create type public.plan_payment_method as enum ('bank_deposit', 'ewallet');
create type public.plan_payment_status as enum ('PENDING', 'APPROVED', 'REJECTED');

create sequence public.invoice_number_seq;

create table public.plan_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  plan_code text not null references public.plans (code) check (plan_code <> 'free'),
  amount numeric(12, 2) not null check (amount >= 0),
  method public.plan_payment_method not null,
  reference text,
  proof_path text not null,
  status public.plan_payment_status not null default 'PENDING',
  note text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  -- Set on approval.
  invoice_number text unique,
  starts_at timestamptz,
  ends_at timestamptz,
  check (proof_path like business_id::text || '/%'),
  check ((status = 'APPROVED') = (invoice_number is not null))
);

create index plan_payments_business_idx on public.plan_payments (business_id, created_at desc);
-- At most one payment waiting for approval per business.
create unique index plan_payments_one_pending on public.plan_payments (business_id) where status = 'PENDING';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

-- The plan in force right now: a paid plan past its end date is Free.
create function public.business_plan(p_business_id uuid)
returns public.plans
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.plans p
  where p.code = coalesce((
    select s.plan_code from public.subscriptions s
    where s.business_id = p_business_id
      and (s.plan_code = 'free' or s.expires_at > now())
  ), 'free');
$$;

-- What this business pays for a year of a plan today.
create function public.plan_price(p_business_id uuid, p_plan_code text)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select case when current_date <= s.founding_until then p.founding_price else p.yearly_price end
  from public.plans p
  left join public.subscriptions s on s.business_id = p_business_id
  where p.code = p_plan_code;
$$;

-- Every new business starts on Free, with founding prices during launch.
create function public._businesses_start_free()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.subscriptions (business_id, founding_until)
  select new.id,
         case when new.created_at::date <= ps.launch_ends_on
              then (new.created_at + interval '1 year')::date end
  from public.platform_settings ps;
  return new;
end;
$$;

create trigger businesses_start_free
after insert on public.businesses
for each row execute function public._businesses_start_free();

-- Businesses that already exist start on Free too.
insert into public.subscriptions (business_id, founding_until)
select b.id,
       case when b.created_at::date <= ps.launch_ends_on
            then (b.created_at + interval '1 year')::date end
from public.businesses b cross join public.platform_settings ps
on conflict do nothing;

-- FR-PL-02: the plan's item limit. Removed (archived) items don't count.
create function public._items_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
begin
  if new.archived or (tg_op = 'UPDATE' and not old.archived) then
    return new;
  end if;
  v_plan := public.business_plan(new.business_id);
  if v_plan.item_limit is not null and (
    select count(*) from public.items
    where business_id = new.business_id and not archived and id <> new.id
  ) >= v_plan.item_limit then
    raise exception 'Your % plan allows % items. Upgrade your plan to add more.', v_plan.name, v_plan.item_limit
      using errcode = 'P0001', hint = 'plan_limit';
  end if;
  return new;
end;
$$;

create trigger items_plan_limit
before insert or update of archived on public.items
for each row execute function public._items_plan_limit();

-- FR-PL-02: the plan's user limit (for staff invites).
create function public._members_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.plans;
begin
  v_plan := public.business_plan(new.business_id);
  if v_plan.user_limit is not null and (
    select count(*) from public.business_members where business_id = new.business_id
  ) >= v_plan.user_limit then
    raise exception 'Your % plan allows % users. Upgrade your plan to add more.', v_plan.name, v_plan.user_limit
      using errcode = 'P0001', hint = 'plan_limit';
  end if;
  return new;
end;
$$;

create trigger members_plan_limit
before insert on public.business_members
for each row execute function public._members_plan_limit();

-- ---------------------------------------------------------------------------
-- Business API
-- ---------------------------------------------------------------------------

-- FR-PL-03: the owner sends proof of a bank deposit or eWallet payment for a
-- paid plan. The proof is already uploaded to the payment-proofs bucket.
create function public.request_plan(
  p_business_id uuid,
  p_plan_code text,
  p_method public.plan_payment_method,
  p_reference text,
  p_proof_path text
)
returns public.plan_payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.plan_payments;
begin
  if not public.is_business_owner(p_business_id) then
    raise exception 'Only the business owner can change the plan' using errcode = '42501';
  end if;
  if p_plan_code is null or p_plan_code = 'free'
     or not exists (select 1 from public.plans where code = p_plan_code) then
    raise exception 'Choose Pro or Business';
  end if;
  if coalesce(p_proof_path, '') = '' then
    raise exception 'Add a photo or screenshot of your proof of payment';
  end if;
  if exists (select 1 from public.plan_payments where business_id = p_business_id and status = 'PENDING') then
    raise exception 'You already sent a payment that is waiting for approval';
  end if;

  insert into public.plan_payments (business_id, plan_code, amount, method, reference, proof_path, created_by)
  values (p_business_id, p_plan_code, public.plan_price(p_business_id, p_plan_code), p_method,
          nullif(trim(p_reference), ''), p_proof_path, auth.uid())
  returning * into v_payment;
  return v_payment;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin API
-- ---------------------------------------------------------------------------

-- FR-PL-03: approving switches the plan on for 12 months and numbers the
-- invoice. Paying again for the plan you already have adds 12 months to the
-- end; a different plan starts today. Rejecting needs a reason.
create function public.review_plan_payment(p_payment_id uuid, p_approve boolean, p_note text default null)
returns public.plan_payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.plan_payments;
  v_sub public.subscriptions;
  v_start timestamptz;
begin
  if not public.is_platform_admin() then
    raise exception 'Only platform admins can review payments' using errcode = '42501';
  end if;

  select * into v_payment from public.plan_payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;
  if v_payment.status <> 'PENDING' then
    raise exception 'This payment was already reviewed';
  end if;

  if not p_approve then
    if coalesce(trim(p_note), '') = '' then
      raise exception 'Give a reason so the business knows what to fix';
    end if;
    update public.plan_payments
    set status = 'REJECTED', note = trim(p_note), reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_payment_id
    returning * into v_payment;
    return v_payment;
  end if;

  select * into v_sub from public.subscriptions where business_id = v_payment.business_id for update;
  v_start := case when v_sub.plan_code = v_payment.plan_code and v_sub.expires_at > now()
                  then v_sub.expires_at else now() end;

  update public.subscriptions
  set plan_code = v_payment.plan_code, expires_at = v_start + interval '12 months'
  where business_id = v_payment.business_id;

  update public.plan_payments
  set status = 'APPROVED', note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now(),
      invoice_number = 'INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0'),
      starts_at = v_start, ends_at = v_start + interval '12 months'
  where id = p_payment_id
  returning * into v_payment;
  return v_payment;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reports by plan (SRS section 6: basic reports on every plan; full reports
-- and CSV export on Pro and Business)
-- ---------------------------------------------------------------------------

alter function public.business_report(uuid, date, date) rename to _business_report_all;

create function public.business_report(p_business_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_report jsonb := public._business_report_all(p_business_id, p_from, p_to);
begin
  if (public.business_plan(p_business_id)).full_reports then
    return v_report || '{"full": true}'::jsonb;
  end if;
  return (v_report - 'items' - 'outstanding' - 'deposits_held' - 'top_customers') || '{"full": false}'::jsonb;
end;
$$;

-- ---------------------------------------------------------------------------
-- Proof-of-payment storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Paths are <business id>/<file>. Owners upload; the business's members and
-- platform admins can view.
create policy "owners upload payment proofs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and public.is_business_owner(public.storage_path_business(name))
  );

create policy "members and admins view payment proofs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (public.is_business_member(public.storage_path_business(name)) or public.is_platform_admin())
  );

-- ---------------------------------------------------------------------------
-- Row level security and grants
-- ---------------------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.platform_settings enable row level security;
alter table public.platform_admins enable row level security;
alter table public.subscriptions enable row level security;
alter table public.plan_payments enable row level security;

create policy "signed-in users read plans" on public.plans
  for select to authenticated using (true);
create policy "admins update plans" on public.plans
  for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "signed-in users read platform settings" on public.platform_settings
  for select to authenticated using (true);
create policy "admins update platform settings" on public.platform_settings
  for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "admins read admins" on public.platform_admins
  for select to authenticated using (public.is_platform_admin());

create policy "members and admins read subscriptions" on public.subscriptions
  for select to authenticated
  using (public.is_business_member(business_id) or public.is_platform_admin());

create policy "members and admins read plan payments" on public.plan_payments
  for select to authenticated
  using (public.is_business_member(business_id) or public.is_platform_admin());

-- Admins need business names on the approval screen.
create policy "admins read businesses" on public.businesses
  for select to authenticated using (public.is_platform_admin());

revoke all on public.plans, public.platform_settings, public.platform_admins,
  public.subscriptions, public.plan_payments from anon;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
grant execute on function public.confirm_public_payment(text, uuid) to anon, authenticated;
grant execute on function public.get_public_handovers(text) to anon, authenticated;
grant execute on function public.respond_public_handover(text, uuid, boolean, text) to anon, authenticated;
revoke execute on function public._business_report_all(uuid, date, date) from authenticated;
revoke execute on function public._businesses_start_free() from authenticated;
revoke execute on function public._items_plan_limit() from authenticated;
revoke execute on function public._members_plan_limit() from authenticated;
