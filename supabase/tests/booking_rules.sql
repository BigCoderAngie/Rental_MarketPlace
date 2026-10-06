-- Booking and availability rules, checked against a real database.
-- Run with: npm run test:db  (needs `npx supabase start` first)
-- Everything runs in one transaction that is rolled back at the end.

\set ON_ERROR_STOP on
begin;

-- Fixtures, created as the database owner.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'outsider@test.local');

insert into public.businesses (id, name, towns) values
  ('10000000-0000-0000-0000-000000000001', 'Test Hire', '{Windhoek}');
insert into public.business_members (business_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'owner');

insert into public.items (id, business_id, name, category, quantity_owned, daily_price, deposit, turnaround_days) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Chair', 'events', 10, 5, 2, 0),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 1, 800, 1000, 1);

-- Act as the owner.
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid) on commit drop;

-- 1. A confirmed booking holds 6 of 10 chairs on 10-12 Jan.
insert into ids
select 'first', (public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '+264811111111',
  '2030-01-10', '2030-01-12',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 6}]'
)).id;

do $$
begin
  assert (select status from public.bookings where id = (select id from ids where name = 'first')) = 'CONFIRMED',
    'direct booking should be confirmed on accept';
  assert (select deposit_amount from public.bookings where id = (select id from ids where name = 'first')) = 12,
    'deposit should be deposit x quantity';
  assert (select count(*) from public.booking_events where booking_id = (select id from ids where name = 'first')) = 3,
    'history should hold REQUESTED, ACCEPTED, CONFIRMED';
end $$;

-- 2. 5 more chairs on 12-14 Jan would leave -1 on the 12th, so it is blocked.
do $$
begin
  perform public.create_booking(
    '10000000-0000-0000-0000-000000000001', 'Ben', '+264812222222',
    '2030-01-12', '2030-01-14',
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 5}]'
  );
  raise exception 'expected a double-booking error';
exception when others then
  if sqlerrm not like 'Not enough "Chair" on 2030-01-12: 4 available, 5 needed' then raise; end if;
end $$;

-- 3. The same request saved without accepting does not hold stock (FR-CA-03).
insert into ids
select 'request', (public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Ben', '+264812222222',
  '2030-01-12', '2030-01-14',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 5}]',
  p_accept => false
)).id;

do $$
begin
  assert (select available from public.item_availability('10000000-0000-0000-0000-000000000001', '2030-01-12', '2030-01-12')
          where item_id = '20000000-0000-0000-0000-000000000001') = 4,
    'a pending request must not reduce availability';
end $$;

-- 4. Accepting that request is blocked too.
do $$
begin
  perform public.accept_booking((select id from ids where name = 'request'));
  raise exception 'expected a double-booking error';
exception when others then
  if sqlerrm not like 'Not enough "Chair"%' then raise; end if;
end $$;

-- 5. After the first booking is cancelled, the request can be accepted.
select public.cancel_booking((select id from ids where name = 'first'), 'Customer changed plans');
select public.accept_booking((select id from ids where name = 'request'));

do $$
begin
  assert (select available from public.item_availability('10000000-0000-0000-0000-000000000001', '2030-01-12', '2030-01-12')
          where item_id = '20000000-0000-0000-0000-000000000001') = 5,
    'cancelling should release stock';
end $$;

-- 6. Turnaround days: a tent back on the 20th is not free until the 22nd.
select public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '+264811111111',
  '2030-01-18', '2030-01-20',
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1}]'
);

do $$
begin
  perform public.create_booking(
    '10000000-0000-0000-0000-000000000001', 'Cara', '+264813333333',
    '2030-01-21', '2030-01-21',
    '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1}]'
  );
  raise exception 'expected a turnaround clash';
exception when others then
  if sqlerrm not like 'Not enough "Tent" on 2030-01-21%' then raise; end if;
end $$;

select public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Cara', '+264813333333',
  '2030-01-22', '2030-01-22',
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1}]'
);

-- 7. Section 4.2: a confirmed booking cannot jump straight to CLOSED.
do $$
begin
  perform public.set_booking_status((select id from ids where name = 'request'), 'CLOSED');
  raise exception 'expected an invalid transition error';
exception when others then
  if sqlerrm not like 'A CONFIRMED booking cannot become CLOSED' then raise; end if;
end $$;

-- 8. Stock cannot drop below, or be archived from under, what bookings hold.
do $$
begin
  update public.items set quantity_owned = 4 where id = '20000000-0000-0000-0000-000000000001';
  raise exception 'expected a stock guard error';
exception when others then
  if sqlerrm not like 'Bookings already hold more "Chair"%' then raise; end if;
end $$;

do $$
begin
  update public.items set archived = true where id = '20000000-0000-0000-0000-000000000001';
  raise exception 'expected archiving to be blocked';
exception when others then
  if sqlerrm not like 'Bookings already hold more "Chair"%' then raise; end if;
end $$;

-- 9. Clients cannot write bookings directly.
do $$
begin
  update public.bookings set status = 'CLOSED';
  assert not found, 'direct booking updates must be blocked by RLS';
end $$;

-- 10. An outsider sees nothing and cannot book.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';

do $$
begin
  assert (select count(*) from public.bookings) = 0, 'outsider must not see bookings';
  assert (select count(*) from public.items) = 0, 'outsider must not see items';
  perform public.create_booking(
    '10000000-0000-0000-0000-000000000001', 'Eve', '+264819999999',
    '2030-02-01', '2030-02-01',
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]'
  );
  raise exception 'expected outsider to be refused';
exception when others then
  if sqlerrm <> 'Business not found' then raise; end if;
end $$;

-- 11. Anyone signed in can start their own business and becomes its owner.
do $$
declare
  v_id uuid;
begin
  v_id := (public.create_business('Eve Tools', '{Swakopmund}')).id;
  assert public.is_business_owner(v_id), 'creator should own the new business';
end $$;

\echo 'All booking rule checks passed'
rollback;
