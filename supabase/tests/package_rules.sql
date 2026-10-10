-- Packages (FR-IN-03): items grouped with a package price.
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
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Chair', 'events', 250, 5, 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 1, 500, 200),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Their chair', 'events', 10, 5, 0);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid, token text) on commit drop;
grant select on ids to anon;

-- 1. A package: 1 tent and 100 chairs for N$800 a day (instead of N$1,000).
insert into ids select 'wedding', p.id, null from public.save_package(
  '10000000-0000-0000-0000-000000000001', null, 'Wedding 100', 'Tent and chairs', 800,
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1},
    {"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 100}]') p;

do $$
begin
  perform public.save_package('10000000-0000-0000-0000-000000000001', null, 'Sneaky', null, 10,
    '[{"item_id": "20000000-0000-0000-0000-000000000003", "quantity": 1}]');
  raise exception 'expected another business''s item to be refused';
exception when others then
  if sqlerrm <> 'One or more items do not belong to this business' then raise; end if;
end $$;

-- 2. Book the package plus 20 extra chairs for 2 days.
insert into ids select 'b', b.id, b.public_token from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-05-01', '2030-05-02',
  jsonb_build_array(
    jsonb_build_object('package_id', (select id from ids where name = 'wedding'), 'quantity', 1),
    '{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 20}'::jsonb)) b;

do $$
begin
  assert (select quantity from public.booking_items
          where booking_id = (select id from ids where name = 'b')
            and item_id = '20000000-0000-0000-0000-000000000001') = 120, 'chairs from the package and extras are held together';
  assert (select package_units from public.booking_items
          where booking_id = (select id from ids where name = 'b')
            and item_id = '20000000-0000-0000-0000-000000000001') = 100, '100 of them are package units';
  -- (800 + 20 × 5) × 2 days = 1,800
  assert public.booking_total((select id from ids where name = 'b')) = 1800,
    format('total should be 1800, got %s', public.booking_total((select id from ids where name = 'b')));
  assert (select deposit_amount from public.bookings where id = (select id from ids where name = 'b')) = 320,
    'deposit is per physical unit: 120 chairs + 1 tent';
end $$;

-- 3. The package's tent is taken, so a second wedding the same day is refused.
do $$
begin
  perform public.create_booking(
    '10000000-0000-0000-0000-000000000001', 'Ben', '0812222222', '2030-05-02', '2030-05-02',
    jsonb_build_array(jsonb_build_object('package_id', (select id from ids where name = 'wedding'), 'quantity', 1)));
  raise exception 'expected a double booking to fail';
exception when others then
  if sqlerrm not like 'Not enough "Tent"%' then raise; end if;
end $$;

-- 4. Changing the package price later doesn't change the booking.
select public.save_package('10000000-0000-0000-0000-000000000001', (select id from ids where name = 'wedding'),
  'Wedding 100', 'Tent and chairs', 900,
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1},
    {"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 100}]');
do $$
begin
  assert public.booking_total((select id from ids where name = 'b')) = 1800, 'booked package price is kept';
end $$;

-- 5. Editing: drop the extras; the package stays at its booked price.
select public.update_booking((select id from ids where name = 'b'), '2030-05-01', '2030-05-02',
  jsonb_build_array(jsonb_build_object('package_id', (select id from ids where name = 'wedding'), 'quantity', 1)));
do $$
begin
  assert public.booking_total((select id from ids where name = 'b')) = 1600, 'package only: 800 × 2';
  assert (select note from public.booking_events where booking_id = (select id from ids where name = 'b')
          order by id desc limit 1) like 'Changed items 100 × Chair, 1 × Tent (were 120 × Chair, 1 × Tent)%',
    'the history records the change';
end $$;

-- 6. A quote with the package; accepting it carries the package price over.
insert into ids select 'q', q.id, q.public_token from public.create_quote(
  '10000000-0000-0000-0000-000000000001', 'Cara', '0813333333', '2030-06-01', '2030-06-01',
  jsonb_build_array(
    jsonb_build_object('package_id', (select id from ids where name = 'wedding'), 'quantity', 1),
    '{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 10}'::jsonb)) q;
reset role;
do $$
begin
  assert public.quote_total((select id from ids where name = 'q')) = 950, 'quote: 900 + 10 × 5';
end $$;

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
do $$
declare
  v jsonb;
begin
  v := public.get_public_quote((select token from ids where name = 'q'));
  assert v -> 'packages' -> 0 ->> 'contents' = '100 × Chair, 1 × Tent', 'customer sees what is in the package';
  assert (v -> 'items' -> 0 ->> 'quantity')::int = 10, 'items list shows only the extras';
  perform public.accept_public_quote((select token from ids where name = 'q'), 'Cara', '0813333333');
end $$;

reset role;
do $$
declare
  v_booking uuid := (select booking_id from public.quotes where id = (select id from ids where name = 'q'));
begin
  assert public.booking_total(v_booking) = 950, 'the booking keeps the quoted package price';
  assert (public.get_public_booking((select public_token from public.bookings where id = v_booking))
          -> 'packages' -> 0 ->> 'name') = 'Wedding 100', 'the booking link shows the package';
end $$;

-- 7. Other businesses can't see or use the package.
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  assert (select count(*) from public.packages) = 0, 'another business must not see packages';
  perform public.create_booking(
    '10000000-0000-0000-0000-000000000002', 'Dan', '0814444444', '2030-07-01', '2030-07-01',
    jsonb_build_array(jsonb_build_object('package_id', (select id from ids where name = 'wedding'), 'quantity', 1)));
  raise exception 'expected another business''s package to be refused';
exception when others then
  if sqlerrm <> 'One or more packages do not belong to this business' then raise; end if;
end $$;

\echo 'All package checks passed'
rollback;
