-- Payment record rules: balances, deposits, voiding and the customer's link.
-- Run with: npm run test:db  (needs `npm run db:start` first)
-- Everything runs in one transaction that is rolled back at the end.

\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'outsider@test.local');

insert into public.businesses (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Test Hire');
insert into public.business_members (business_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'owner');
insert into public.items (id, business_id, name, category, quantity_owned, daily_price, deposit) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 2, 500, 1000);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid, token text) on commit drop;
grant select on ids to anon;

-- A confirmed booking: 1 tent for 3 days = N$1,500 due, N$1,000 deposit expected.
insert into ids
select 'b', b.id, b.public_token from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111',
  '2030-04-01', '2030-04-03',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]'
) b;

-- 1. Record a part payment and the deposit.
select public.record_payment((select id from ids where name = 'b'), 'RENTAL', 600, 'eft', '2030-03-20', 'Booking payment');
select public.record_payment((select id from ids where name = 'b'), 'DEPOSIT_RECEIVED', 1000, 'cash', '2030-04-01');

do $$
declare
  v public.booking_balances;
begin
  select * into v from public.booking_balances where booking_id = (select id from ids where name = 'b');
  assert v.amount_due = 1500, format('due should be 1500, got %s', v.amount_due);
  assert v.amount_paid = 600 and v.outstanding = 900, 'paid 600 leaves 900 outstanding';
  assert v.deposit_held = 1000, 'deposit held after receiving it';
end $$;

-- 2. Keeping part of the deposit needs a reason, and has no payment method.
do $$
begin
  perform public.record_payment((select id from ids where name = 'b'), 'DEPOSIT_DEDUCTED', 200, null, '2030-04-04', '  ');
  raise exception 'expected a reason to be required';
exception when others then
  if sqlerrm <> 'Give a reason for keeping part of the deposit' then raise; end if;
end $$;

select public.record_payment((select id from ids where name = 'b'), 'DEPOSIT_DEDUCTED', 200, 'cash', '2030-04-04', 'Torn side panel');

do $$
begin
  assert (select method from public.payments where kind = 'DEPOSIT_DEDUCTED') is null,
    'a deduction moves no money, so it has no method';
end $$;

-- 3. Cannot give back more deposit than is left.
do $$
begin
  perform public.record_payment((select id from ids where name = 'b'), 'DEPOSIT_RETURNED', 900, 'cash', '2030-04-04');
  raise exception 'expected over-return to fail';
exception when others then
  if sqlerrm not like 'That would return or keep more deposit than was received%' then raise; end if;
end $$;

select public.record_payment((select id from ids where name = 'b'), 'DEPOSIT_RETURNED', 800, 'cash', '2030-04-04');

-- 4. Cannot refund more than was paid.
do $$
begin
  perform public.record_payment((select id from ids where name = 'b'), 'REFUND', 601, 'eft', '2030-04-04');
  raise exception 'expected over-refund to fail';
exception when others then
  if sqlerrm <> 'That would refund more than the customer has paid' then raise; end if;
end $$;

-- 5. Voiding corrects a mistake but keeps the record, and cannot break the deposit maths.
do $$
declare
  v_id uuid;
begin
  v_id := (public.record_payment((select id from ids where name = 'b'), 'RENTAL', 9000, 'cash', '2030-04-02')).id;
  perform public.void_payment(v_id, 'Typed an extra zero');
  assert (select outstanding from public.booking_balances where booking_id = (select id from ids where name = 'b')) = 900,
    'a voided record does not count';
  assert (select count(*) from public.payments where id = v_id) = 1, 'a voided record is kept';

  perform public.void_payment(
    (select id from public.payments where kind = 'DEPOSIT_RECEIVED'), 'Wrong booking');
  raise exception 'expected voiding the received deposit to fail while returns exist';
exception when others then
  if sqlerrm not like 'That would return or keep more deposit than was received%' then raise; end if;
end $$;

-- 6. Clients cannot write payments directly.
do $$
begin
  update public.payments set amount = 1;
  assert not found, 'direct payment updates must be blocked by RLS';
end $$;

-- 7. Cancelled bookings take refunds, not new payments.
insert into ids
select 'c', b.id, b.public_token from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Ben', '0812222222',
  '2030-05-01', '2030-05-01',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]'
) b;
select public.record_payment((select id from ids where name = 'c'), 'RENTAL', 500, 'cash', '2030-04-20');
select public.cancel_booking((select id from ids where name = 'c'), 'Event called off');

do $$
begin
  perform public.record_payment((select id from ids where name = 'c'), 'RENTAL', 100, 'cash', '2030-04-21');
  raise exception 'expected payments on a cancelled booking to fail';
exception when others then
  if sqlerrm not like 'This booking is cancelled%' then raise; end if;
end $$;
select public.record_payment((select id from ids where name = 'c'), 'REFUND', 500, 'cash', '2030-04-21');

-- 8. Outsiders see no payments or balances and cannot record any.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  assert (select count(*) from public.payments) = 0, 'outsider must not see payments';
  assert (select count(*) from public.booking_balances) = 0, 'outsider must not see balances';
  perform public.record_payment((select id from ids where name = 'b'), 'RENTAL', 1, 'cash', '2030-04-01');
  raise exception 'expected outsider to be refused';
exception when others then
  if sqlerrm <> 'Booking not found' then raise; end if;
end $$;

-- 9. The customer's link shows the booking and lets them confirm a payment.
reset role;
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

do $$
declare
  v jsonb;
  v_payment uuid;
begin
  assert public.get_public_booking('not-a-real-token') is null, 'unknown link shows nothing';

  v := public.get_public_booking((select token from ids where name = 'b'));
  assert (v -> 'balance' ->> 'outstanding')::numeric = 900, 'link shows the outstanding amount';
  assert (v -> 'balance' ->> 'deposit_held')::numeric = 0, 'deposit fully settled';
  assert jsonb_array_length(v -> 'payments') = 4, 'voided records are hidden from the customer';

  v_payment := (v -> 'payments' -> 0 ->> 'id')::uuid;
  perform public.confirm_public_payment((select token from ids where name = 'b'), v_payment);
  assert public.get_public_booking((select token from ids where name = 'b')) -> 'payments' -> 0
         ->> 'customer_confirmed_at' is not null, 'confirmation is recorded';

  -- Another booking's link cannot confirm this booking's payments.
  begin
    perform public.confirm_public_payment((select token from ids where name = 'c'), v_payment);
    raise exception 'expected a cross-booking confirm to fail';
  exception when others then
    if sqlerrm <> 'Payment not found or already confirmed' then raise; end if;
  end;

  -- And anonymous visitors cannot record payments.
  begin
    perform public.record_payment((select id from ids where name = 'b'), 'RENTAL', 1, 'cash', '2030-04-01');
    raise exception 'expected anon to be refused';
  exception when insufficient_privilege then null;
  end;
end $$;

\echo 'All payment rule checks passed'
rollback;
