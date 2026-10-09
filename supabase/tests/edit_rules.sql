-- Changing a booking's dates or quantities (FR-BK-07).
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
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Chair', 'events', 10, 5, 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 1, 500, 100);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid) on commit drop;

-- Anna has 6 chairs on 1-2 July; Ben has the only tent on 5 July.
insert into ids select 'anna', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-07-01', '2030-07-02',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 6}]') b;
insert into ids select 'ben', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Ben', '0812222222', '2030-07-05', '2030-07-05',
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1},
    {"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 4}]') b;

-- Prices go up after Anna booked.
reset role;
update public.items set daily_price = 7 where id = '20000000-0000-0000-0000-000000000001';
update public.items set daily_price = 600 where id = '20000000-0000-0000-0000-000000000002';
set local role authenticated;

-- 1. Growing within stock works; Anna's own old units don't count against her.
select public.update_booking((select id from ids where name = 'anna'), '2030-07-01', '2030-07-03',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 10}]', 'Bigger party');

do $$
begin
  assert (select end_date from public.bookings where id = (select id from ids where name = 'anna')) = '2030-07-03',
    'new end date saved';
  assert (select quantity from public.booking_items where booking_id = (select id from ids where name = 'anna')) = 10,
    'new quantity saved';
  assert (select daily_price from public.booking_items where booking_id = (select id from ids where name = 'anna')) = 5,
    'an item already on the booking keeps its booked price';
  assert (select deposit_amount from public.bookings where id = (select id from ids where name = 'anna')) = 10,
    'deposit follows the new quantity';
  assert (select note from public.booking_events where booking_id = (select id from ids where name = 'anna')
          order by id desc limit 1)
         = 'Changed dates 01 Jul to 03 Jul (were 01 Jul to 02 Jul); items 10 × Chair (were 6 × Chair). Bigger party',
    'the change is in the history';
end $$;

-- 2. Moving onto Ben's day would double-book; nothing changes.
do $$
begin
  perform public.update_booking((select id from ids where name = 'anna'), '2030-07-05', '2030-07-05',
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 10}]');
  raise exception 'expected a double booking to fail';
exception when others then
  if sqlerrm <> 'Not enough "Chair" on 2030-07-05: 6 available, 10 needed' then raise; end if;
end $$;

do $$
begin
  assert (select start_date from public.bookings where id = (select id from ids where name = 'anna')) = '2030-07-01',
    'a refused change leaves the booking as it was';
end $$;

-- 3. Adding the tent (taken by Ben that day) is refused; adding it on a free day uses today's price.
do $$
begin
  perform public.update_booking((select id from ids where name = 'anna'), '2030-07-05', '2030-07-05',
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1},
      {"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1}]');
  raise exception 'expected the taken tent to fail';
exception when others then
  if sqlerrm not like 'Not enough "Tent"%' then raise; end if;
end $$;

select public.update_booking((select id from ids where name = 'anna'), '2030-07-01', '2030-07-03',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 10},
    {"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1}]');
do $$
begin
  assert (select daily_price from public.booking_items
          where booking_id = (select id from ids where name = 'anna')
            and item_id = '20000000-0000-0000-0000-000000000002') = 600,
    'a newly added item takes today''s price';
end $$;

-- 4. Removing an item by setting it to 0; at least one item must stay.
select public.update_booking((select id from ids where name = 'anna'), '2030-07-01', '2030-07-03',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 10},
    {"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 0}]');
do $$
begin
  assert (select count(*) from public.booking_items where booking_id = (select id from ids where name = 'anna')) = 1,
    'a 0 quantity removes the item';
  perform public.update_booking((select id from ids where name = 'anna'), '2030-07-01', '2030-07-03',
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 0}]');
  raise exception 'expected an empty booking to fail';
exception when others then
  if sqlerrm <> 'Add at least one item' then raise; end if;
end $$;

-- 5. A booking that has gone out can't be changed here.
select public.record_checkout((select id from ids where name = 'ben'),
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1},
    {"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 4}]', true);
do $$
begin
  perform public.update_booking((select id from ids where name = 'ben'), '2030-07-05', '2030-07-06',
    '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1}]');
  raise exception 'expected a checked-out booking to be refused';
exception when others then
  if sqlerrm <> 'A checked out booking can no longer be changed' then raise; end if;
end $$;

-- 6. Outsiders can't change it, and clients can't write booking lines directly.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  perform public.update_booking((select id from ids where name = 'anna'), '2030-07-01', '2030-07-01',
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]');
  raise exception 'expected outsider to be refused';
exception when others then
  if sqlerrm <> 'Booking not found' then raise; end if;
end $$;

set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
do $$
begin
  update public.booking_items set quantity = 1;
  assert not found, 'direct line updates must be blocked by RLS';
end $$;

-- 7. The edit screen's free counts can leave out the booking's own units.
do $$
begin
  assert (select available from public.item_availability(
            '10000000-0000-0000-0000-000000000001', '2030-07-01', '2030-07-01')
          where item_id = '20000000-0000-0000-0000-000000000001') = 0,
    'Anna''s 10 chairs are held';
  assert (select available from public.item_availability(
            '10000000-0000-0000-0000-000000000001', '2030-07-01', '2030-07-01',
            (select id from ids where name = 'anna'))
          where item_id = '20000000-0000-0000-0000-000000000001') = 10,
    'leaving Anna out shows all 10 free';
end $$;

\echo 'All booking edit checks passed'
rollback;
