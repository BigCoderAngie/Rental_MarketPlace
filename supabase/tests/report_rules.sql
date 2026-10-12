-- Reports (FR-RP-01): revenue, bookings, utilisation, outstanding, deposits
-- held and top customers for a period.
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
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 2, 500, 1000),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Chair', 'events', 100, 5, 0);

-- Full reports come with Pro and Business.
update public.subscriptions set plan_code = 'pro', expires_at = now() + interval '1 year'
where business_id = '10000000-0000-0000-0000-000000000001';

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid) on commit drop;

-- Anna: 1 tent for 3 days in April = N$1,500.
insert into ids select 'anna', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-04-01', '2030-04-03',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]') b;
-- Ben: 50 chairs for 4 days, 2 of them in April = N$1,000.
insert into ids select 'ben', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Ben', '0812222222', '2030-04-29', '2030-05-02',
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 50}]') b;
-- Anna again, cancelled: counted, but not valued or used.
insert into ids select 'cancelled', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-04-10', '2030-04-10',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]') b;
select public.cancel_booking((select id from ids where name = 'cancelled'), 'Changed plans');
-- Cara: in May, unpaid.
insert into ids select 'cara', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Cara', '0813333333', '2030-05-05', '2030-05-05',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]') b;

select public.record_payment((select id from ids where name = 'anna'), 'RENTAL', 600, 'eft', '2030-03-20');
select public.record_payment((select id from ids where name = 'anna'), 'RENTAL', 400, 'cash', '2030-04-01');
select public.record_payment((select id from ids where name = 'anna'), 'DEPOSIT_RECEIVED', 1000, 'cash', '2030-04-01');
select public.record_payment((select id from ids where name = 'ben'), 'RENTAL', 1000, 'eft', '2030-04-10');
select public.record_payment((select id from ids where name = 'ben'), 'REFUND', 100, 'eft', '2030-04-12');
-- A voided record never counts.
select public.void_payment(
  (select id from public.payments where kind = 'REFUND'), 'Typed the wrong amount');
select public.record_payment((select id from ids where name = 'ben'), 'REFUND', 100, 'eft', '2030-04-12');

create temporary table r on commit drop as
select public.business_report('10000000-0000-0000-0000-000000000001', '2030-04-01', '2030-04-30') as j;

do $$
declare
  j jsonb := (select j from r);
begin
  -- 1. Money recorded in April: 400 + 1,000 received, 100 refunded.
  assert j -> 'revenue' = '{"rental_received": 1400, "refunded": 100, "deposits_kept": 0, "total": 1300,
                            "by_method": [{"method": "eft", "amount": 900}, {"method": "cash", "amount": 400}]}'::jsonb,
    format('revenue: %s', j -> 'revenue');

  -- 2. Three bookings start in April; two went ahead, worth 2,500.
  assert j -> 'bookings' = '{"count": 3, "went_ahead": 2, "value": 2500,
                             "by_status": {"CONFIRMED": 2, "CANCELLED": 1}}'::jsonb,
    format('bookings: %s', j -> 'bookings');

  -- 3. Tent: 3 of 60 unit-days. Chairs: 100 of 3,000 (only April's days count).
  assert j -> 'items' = '[{"name": "Chair", "in_service": 100, "unit_days_booked": 100, "utilisation": 3.3},
                          {"name": "Tent", "in_service": 2, "unit_days_booked": 3, "utilisation": 5.0}]'::jsonb,
    format('items: %s', j -> 'items');

  -- 4. Owed right now: Anna 500, Ben 100, Cara 500 (in May, still listed).
  assert (select jsonb_agg(jsonb_build_array(o ->> 'reference' is not null, o ->> 'customer', (o ->> 'amount')::numeric))
          from jsonb_array_elements(j -> 'outstanding') o)
         = '[[true, "Anna", 500], [true, "Ben", 100], [true, "Cara", 500]]'::jsonb,
    format('outstanding: %s', j -> 'outstanding');

  -- 5. Anna's deposit is still held.
  assert jsonb_array_length(j -> 'deposits_held') = 1
     and j -> 'deposits_held' -> 0 ->> 'customer' = 'Anna'
     and (j -> 'deposits_held' -> 0 ->> 'amount')::numeric = 1000,
    format('deposits held: %s', j -> 'deposits_held');

  -- 6. Top customers by bookings that went ahead; the cancelled one is left out.
  assert j -> 'top_customers' = '[{"name": "Anna", "phone": "0811111111", "bookings": 1, "value": 1500},
                                  {"name": "Ben", "phone": "0812222222", "bookings": 1, "value": 1000}]'::jsonb,
    format('top customers: %s', j -> 'top_customers');
end $$;

-- 7. On Free, only money recorded and bookings are included.
reset role;
update public.subscriptions set expires_at = now() - interval '1 day'
where business_id = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$
declare
  j jsonb := public.business_report('10000000-0000-0000-0000-000000000001', '2030-04-01', '2030-04-30');
begin
  assert (j ->> 'full')::boolean = false and j ? 'revenue' and j ? 'bookings'
     and not j ? 'items' and not j ? 'outstanding' and not j ? 'deposits_held' and not j ? 'top_customers',
    format('free report keys: %s', (select array_agg(k) from jsonb_object_keys(j) k));
  assert (j -> 'revenue' ->> 'total')::numeric = 1300, 'free report still has the money recorded';
end $$;

-- 8. Periods must make sense.
do $$
begin
  perform public.business_report('10000000-0000-0000-0000-000000000001', '2030-04-30', '2030-04-01');
  raise exception 'expected a backwards period to be refused';
exception when others then
  if sqlerrm <> 'The end date must be on or after the start date' then raise; end if;
end $$;
do $$
begin
  perform public.business_report('10000000-0000-0000-0000-000000000001', '2030-01-01', '2031-06-01');
  raise exception 'expected a long period to be refused';
exception when others then
  if sqlerrm <> 'Choose a period of a year or less' then raise; end if;
end $$;

-- 9. Another business cannot read this report, and visitors cannot call it.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  perform public.business_report('10000000-0000-0000-0000-000000000001', '2030-04-01', '2030-04-30');
  raise exception 'expected another business to be refused';
exception when others then
  if sqlerrm <> 'Business not found' then raise; end if;
end $$;

reset role;
do $$
begin
  assert not has_function_privilege('anon', 'public.business_report(uuid, date, date)', 'execute'),
    'visitors must not run reports';
end $$;

rollback;
