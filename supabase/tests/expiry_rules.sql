-- Unanswered booking requests expire (FR-BK-04).
-- Run with: npm run test:db  (needs `npm run db:start` first)
-- Everything runs in one transaction that is rolled back at the end.

\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local');
insert into public.businesses (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Test Hire');
insert into public.business_members (business_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'owner');
insert into public.items (id, business_id, name, category, quantity_owned, daily_price) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 1, 500);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid) on commit drop;

-- Two requests for the only tent: one old and unanswered, one fresh.
insert into ids select 'old', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-07-01', '2030-07-01',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]', p_accept => false) b;
insert into ids select 'fresh', b.id from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Ben', '0812222222', '2030-07-01', '2030-07-01',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]', p_accept => false) b;

reset role;
update public.bookings set request_expires_at = now() - interval '1 minute'
where id = (select id from ids where name = 'old');
set local role authenticated;

-- 1. An expired request can't be accepted, even before the job runs.
do $$
begin
  perform public.accept_booking((select id from ids where name = 'old'));
  raise exception 'expected accepting an expired request to fail';
exception when others then
  if sqlerrm <> 'This request has expired. Ask the customer to make a new one.' then raise; end if;
end $$;

-- 2. Staff can't run the job themselves.
do $$
begin
  perform public.expire_unanswered_requests();
  raise exception 'expected staff to be refused';
exception when insufficient_privilege then null;
end $$;

-- 3. The job expires only the old request, once.
reset role;
do $$
begin
  assert public.expire_unanswered_requests() = 1, 'one request expires';
  assert public.expire_unanswered_requests() = 0, 'running again changes nothing';
  assert (select status from public.bookings where id = (select id from ids where name = 'old')) = 'EXPIRED',
    'the old request is expired';
  assert (select status from public.bookings where id = (select id from ids where name = 'fresh')) = 'REQUESTED',
    'the fresh request is untouched';
  assert (select note from public.booking_events
          where booking_id = (select id from ids where name = 'old') order by id desc limit 1)
         = 'Not answered in time', 'the expiry is in the history';
end $$;

-- 4. The fresh request can still be accepted and takes the tent.
set local role authenticated;
select public.accept_booking((select id from ids where name = 'fresh'));
do $$
begin
  assert (select status from public.bookings where id = (select id from ids where name = 'fresh')) = 'CONFIRMED',
    'a fresh request is accepted as normal';
end $$;

\echo 'All request expiry checks passed'
rollback;
