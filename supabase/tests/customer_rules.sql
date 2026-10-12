-- Customer list: history numbers per customer, and each business sees only
-- its own customers.
-- Run with: npm run test:db  (needs `npm run db:start` first)
-- Everything runs in one transaction that is rolled back at the end.

\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'other@test.local');
insert into public.businesses (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Test Hire'),
  ('10000000-0000-0000-0000-000000000002', 'Other Hire');
insert into public.business_members (business_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'owner'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'owner');
insert into public.items (id, business_id, name, category, quantity_owned, daily_price, deposit) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 3, 500, 1000);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid) on commit drop;

-- Anna books twice (N$500 and N$1,000) and cancels a third; Ben once.
insert into ids select 'a1', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-04-01', '2030-04-01',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]') b;
insert into ids select 'a2', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-06-01', '2030-06-02',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]') b;
insert into ids select 'a3', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-07-01', '2030-07-01',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]') b;
select public.cancel_booking((select id from ids where name = 'a3'), 'Changed plans');
insert into ids select 'b1', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Ben', '0812222222', '2030-04-01', '2030-04-01',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]') b;

select public.record_payment((select id from ids where name = 'a1'), 'RENTAL', 500, 'cash', '2030-04-01');
select public.record_payment((select id from ids where name = 'a2'), 'RENTAL', 200, 'eft', '2030-05-20');
select public.record_payment((select id from ids where name = 'a2'), 'DEPOSIT_RECEIVED', 1000, 'cash', '2030-06-01');

do $$
declare
  v public.customer_summaries;
begin
  select * into v from public.customer_summaries where phone = '0811111111';
  assert v.full_name = 'Anna', 'one customer per phone number';
  assert v.bookings = 2 and v.all_bookings = 3, format('bookings %s of %s', v.bookings, v.all_bookings);
  assert v.last_booking_date = '2030-07-01', 'last booking date';
  assert v.total_value = 1500, format('value should be 1500, got %s', v.total_value);
  assert v.outstanding = 800, format('owed should be 800, got %s', v.outstanding);
  assert v.deposit_held = 1000, format('deposit held should be 1000, got %s', v.deposit_held);

  select * into v from public.customer_summaries where phone = '0812222222';
  assert v.bookings = 1 and v.outstanding = 500 and v.deposit_held = 0, 'Ben owes 500';
end $$;

-- Staff can keep notes on a customer.
update public.customers set notes = 'Pays cash at pickup' where phone = '0811111111';
do $$
begin
  assert (select notes from public.customer_summaries where phone = '0811111111') = 'Pays cash at pickup',
    'notes are saved';
end $$;

-- Another business sees none of these customers and cannot change them.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
update public.customers set notes = 'hacked' where phone = '0811111111';
do $$
begin
  assert (select count(*) from public.customer_summaries) = 0, 'another business sees no customers';
end $$;

reset role;
do $$
begin
  assert (select notes from public.customers where phone = '0811111111') = 'Pays cash at pickup',
    'another business cannot change notes';
  assert not has_table_privilege('anon', 'public.customer_summaries', 'select'),
    'visitors cannot read the customer list';
end $$;

rollback;
