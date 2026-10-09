-- Payment records (SRS 5.7, FR-PY-01 to FR-PY-04).
--
-- The platform never holds rental money. Customers pay the business directly
-- (cash, EFT, eWallet, card) and staff record what was received here, so each
-- booking shows what is due, paid and outstanding, and how much deposit is
-- held. Records are never deleted: a mistake is voided with a reason, which
-- keeps the history honest.
--
-- Each booking also gets a private link (like quotes) where the customer sees
-- the booking and can confirm the payments recorded against it.

-- ---------------------------------------------------------------------------
-- Types and tables
-- ---------------------------------------------------------------------------

create type public.payment_kind as enum (
  'RENTAL',            -- customer paid towards the rental
  'REFUND',            -- business paid rental money back
  'DEPOSIT_RECEIVED',  -- customer handed over a deposit
  'DEPOSIT_DEDUCTED',  -- business kept part of the deposit, with a reason
  'DEPOSIT_RETURNED'   -- business gave the deposit back
);

create type public.payment_method as enum ('cash', 'eft', 'ewallet', 'card', 'other');

alter table public.bookings
  add column public_token text not null unique default replace(gen_random_uuid()::text, '-', '');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind public.payment_kind not null,
  amount numeric(12, 2) not null check (amount > 0),
  -- How the money moved. A deduction moves no money, so it has no method.
  method public.payment_method,
  paid_on date not null,
  note text,
  received_by uuid references auth.users (id),
  customer_confirmed_at timestamptz,
  voided_at timestamptz,
  voided_by uuid references auth.users (id),
  void_reason text,
  created_at timestamptz not null default now(),
  check ((kind = 'DEPOSIT_DEDUCTED') = (method is null)),
  check (kind <> 'DEPOSIT_DEDUCTED' or length(trim(coalesce(note, ''))) > 0),
  check ((voided_at is null) = (void_reason is null))
);

create index payments_booking_idx on public.payments (booking_id);

-- ---------------------------------------------------------------------------
-- Balances
-- ---------------------------------------------------------------------------

-- Rental for every day of the booking, plus extras, less discount.
-- Runs with the caller's rights, so it is null for bookings they cannot see.
create function public.booking_total(p_booking_id uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  select greatest(
    coalesce(sum(bi.quantity * bi.daily_price), 0) * (b.end_date - b.start_date + 1)
      + b.delivery_fee + b.setup_fee - b.discount,
    0
  )
  from public.bookings b
  left join public.booking_items bi on bi.booking_id = b.id
  where b.id = p_booking_id
  group by b.id;
$$;

-- FR-PY-03: due, paid and outstanding per booking, plus deposit held.
-- security_invoker: callers only see balances for bookings they can see.
create view public.booking_balances
with (security_invoker = true)
as
select
  b.id as booking_id,
  b.business_id,
  public.booking_total(b.id) as amount_due,
  coalesce(sum(p.amount) filter (where p.kind = 'RENTAL'), 0)
    - coalesce(sum(p.amount) filter (where p.kind = 'REFUND'), 0) as amount_paid,
  public.booking_total(b.id)
    - coalesce(sum(p.amount) filter (where p.kind = 'RENTAL'), 0)
    + coalesce(sum(p.amount) filter (where p.kind = 'REFUND'), 0) as outstanding,
  coalesce(sum(p.amount) filter (where p.kind = 'DEPOSIT_RECEIVED'), 0) as deposit_received,
  coalesce(sum(p.amount) filter (where p.kind = 'DEPOSIT_DEDUCTED'), 0) as deposit_deducted,
  coalesce(sum(p.amount) filter (where p.kind = 'DEPOSIT_RETURNED'), 0) as deposit_returned,
  coalesce(sum(p.amount) filter (where p.kind = 'DEPOSIT_RECEIVED'), 0)
    - coalesce(sum(p.amount) filter (where p.kind in ('DEPOSIT_DEDUCTED', 'DEPOSIT_RETURNED')), 0)
    as deposit_held
from public.bookings b
left join public.payments p on p.booking_id = b.id and p.voided_at is null
group by b.id;

-- Raises if the booking's live records would refund more than was paid or
-- give back or keep more deposit than was received.
create function public._assert_payments_consistent(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.booking_balances;
begin
  select * into v from public.booking_balances where booking_id = p_booking_id;

  if v.amount_paid < 0 then
    raise exception 'That would refund more than the customer has paid';
  end if;
  if v.deposit_held < 0 then
    raise exception 'That would return or keep more deposit than was received (N$% received)',
      v.deposit_received;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff API
-- ---------------------------------------------------------------------------

-- FR-PY-01 / FR-PY-02: record money received, refunded, or a deposit taken,
-- kept or returned. Recorded only; the platform never collects it.
create function public.record_payment(
  p_booking_id uuid,
  p_kind public.payment_kind,
  p_amount numeric,
  p_method public.payment_method,
  p_paid_on date,
  p_note text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_payment public.payments;
begin
  -- Lock the booking so two staff recording at once cannot overdraw it.
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if not found or not public.is_business_member(v_booking.business_id) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  if p_kind in ('RENTAL', 'DEPOSIT_RECEIVED')
     and v_booking.status in ('DECLINED', 'EXPIRED', 'CANCELLED') then
    raise exception 'This booking is %; record refunds or deposit returns only',
      lower(v_booking.status::text);
  end if;

  if p_kind = 'DEPOSIT_DEDUCTED' and coalesce(trim(p_note), '') = '' then
    raise exception 'Give a reason for keeping part of the deposit';
  end if;

  insert into public.payments (
    booking_id, business_id, kind, amount, method, paid_on, note, received_by
  )
  values (
    p_booking_id, v_booking.business_id, p_kind, p_amount,
    case when p_kind = 'DEPOSIT_DEDUCTED' then null else coalesce(p_method, 'cash') end,
    coalesce(p_paid_on, public.namibia_today()),
    nullif(trim(p_note), ''), auth.uid()
  )
  returning * into v_payment;

  perform public._assert_payments_consistent(p_booking_id);
  return v_payment;
end;
$$;

-- Corrects a mistake without deleting it.
create function public.void_payment(p_payment_id uuid, p_reason text)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where id = p_payment_id;

  if not found or not public.is_business_member(v_payment.business_id) then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;

  perform 1 from public.bookings where id = v_payment.booking_id for update;

  if v_payment.voided_at is not null then
    raise exception 'This record is already voided';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Give a reason for voiding this record';
  end if;

  update public.payments
  set voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_reason)
  where id = p_payment_id
  returning * into v_payment;

  perform public._assert_payments_consistent(v_payment.booking_id);
  return v_payment;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public API (the customer's booking link)
-- ---------------------------------------------------------------------------

create function public.get_public_booking(p_token text)
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
               'name', i.name, 'quantity', bi.quantity, 'daily_price', bi.daily_price
             ) order by i.name)
      from public.booking_items bi join public.items i on i.id = bi.item_id
      where bi.booking_id = b.id
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

-- FR-PY-04: the customer confirms a recorded payment from their link.
create function public.confirm_public_payment(p_token text, p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payments p
  set customer_confirmed_at = now()
  from public.bookings b
  where p.id = p_payment_id
    and b.id = p.booking_id
    and b.public_token = p_token
    and p.voided_at is null
    and p.customer_confirmed_at is null;

  if not found then
    raise exception 'Payment not found or already confirmed' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security and grants
-- ---------------------------------------------------------------------------

alter table public.payments enable row level security;

-- Read-only to staff; writes go through the functions above.
create policy "members read payments" on public.payments
  for select to authenticated using (public.is_business_member(business_id));

revoke all on public.booking_balances from anon;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
grant execute on function public.confirm_public_payment(text, uuid) to anon, authenticated;
revoke execute on function public._assert_payments_consistent(uuid) from authenticated;
