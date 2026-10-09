-- Checkout and return rules: counts, photos, late returns, overdue and the
-- customer's confirmation.
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
insert into public.items (id, business_id, name, category, quantity_owned, daily_price) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Chair', 'events', 50, 5),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Table', 'events', 10, 20);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid, token text) on commit drop;
grant select on ids to anon;

-- A confirmed booking for 20 chairs and 2 tables that ended yesterday, and a
-- request that is not confirmed yet.
insert into ids
select 'b', b.id, b.public_token from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111',
  public.namibia_today() - 3, public.namibia_today() - 1,
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 20},
    {"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 2}]'
) b;
insert into ids
select 'req', b.id, b.public_token from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Ben', '0812222222',
  '2030-06-01', '2030-06-01',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 5}]',
  p_accept => false
) b;

-- 1. Only a confirmed booking can be checked out.
do $$
begin
  perform public.record_checkout((select id from ids where name = 'req'),
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 5}]', true);
  raise exception 'expected checkout of a request to fail';
exception when others then
  if sqlerrm <> 'A REQUESTED booking cannot become CHECKED_OUT' then raise; end if;
end $$;

-- 1b. Staff cannot skip the counts with a plain status change.
do $$
begin
  perform public.set_booking_status((select id from ids where name = 'b'), 'CHECKED_OUT');
  raise exception 'expected a plain checkout to fail';
exception when others then
  if sqlerrm <> 'Record the checkout or return with its item counts' then raise; end if;
end $$;

-- 2. Cannot hand over more than was booked.
do $$
begin
  perform public.record_checkout((select id from ids where name = 'b'),
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 21}]', true);
  raise exception 'expected over-handover to fail';
exception when others then
  if sqlerrm <> 'Only 20 "Chair" were booked, not 21' then raise; end if;
end $$;

-- 3. Photos must sit in this booking's folder.
do $$
begin
  perform public.record_checkout((select id from ids where name = 'b'),
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 20}]', true,
    array['someone-else/other-booking/photo.jpg']);
  raise exception 'expected a foreign photo path to fail';
exception when others then
  if sqlerrm <> 'Photos must be uploaded to this booking''s folder' then raise; end if;
end $$;

-- 4. Check out 20 chairs and 2 tables with a photo.
select public.record_checkout(
  (select id from ids where name = 'b'),
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 20},
    {"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 2}]',
  true,
  array['10000000-0000-0000-0000-000000000001/' || (select id from ids where name = 'b') || '/out-1.jpg'],
  'All clean'
);

do $$
begin
  assert (select status from public.bookings where id = (select id from ids where name = 'b')) = 'CHECKED_OUT',
    'checkout moves the booking to CHECKED_OUT';
  assert (select id_checked from public.handovers where kind = 'CHECKOUT'), 'ID check is recorded';
  assert (select count(*) from public.handover_photos) = 1, 'photo is attached';
end $$;

-- 5. The nightly job flags it overdue, because the end date has passed.
reset role;
select public.mark_overdue_bookings();
do $$
begin
  assert (select status from public.bookings where id = (select id from ids where name = 'b')) = 'OVERDUE',
    'a checked-out booking past its end date becomes OVERDUE';
  assert public.mark_overdue_bookings() = 0, 'running the job again changes nothing';
end $$;
set local role authenticated;

-- 6. Return counts must add up to what went out.
do $$
begin
  perform public.record_return((select id from ids where name = 'b'),
    '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 18, "damaged": 1},
      {"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 2}]');
  raise exception 'expected a short count to fail';
exception when others then
  if sqlerrm not like '20 "Chair" went out but 19 are counted%' then raise; end if;
end $$;

-- 7. 18 fine, 1 damaged, 1 missing; the return is late.
select public.record_return(
  (select id from ids where name = 'b'),
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 18, "damaged": 1, "missing": 1},
    {"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 2}]'
);

do $$
begin
  assert (select status from public.bookings where id = (select id from ids where name = 'b')) = 'RETURNED',
    'an overdue booking can be returned';
  assert (select late from public.handovers where kind = 'RETURN'), 'return after the end date is late';
end $$;

-- 8. Clients cannot write records directly; outsiders cannot record.
do $$
begin
  update public.handovers set late = false;
  assert not found, 'direct updates must be blocked by RLS';
end $$;

set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  assert (select count(*) from public.handovers) = 0, 'outsider must not see records';
  perform public.record_return((select id from ids where name = 'b'), '[]');
  raise exception 'expected outsider to be refused';
exception when others then
  if sqlerrm <> 'Booking not found' then raise; end if;
end $$;

-- 9. The customer agrees with the checkout and disputes the return, which
--    opens a problem on the booking.
reset role;
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

do $$
declare
  v jsonb;
begin
  v := public.get_public_handovers((select token from ids where name = 'b'));
  assert jsonb_array_length(v) = 2, 'customer sees both records';
  assert (v -> 0 ->> 'photo_count')::int = 1, 'customer sees the photo count';

  perform public.respond_public_handover((select token from ids where name = 'b'), (v -> 0 ->> 'id')::uuid, true);

  begin
    perform public.respond_public_handover((select token from ids where name = 'b'), (v -> 1 ->> 'id')::uuid, false, '');
    raise exception 'expected a dispute without a note to fail';
  exception when others then
    if sqlerrm <> 'Say what is wrong so the business can sort it out' then raise; end if;
  end;

  perform public.respond_public_handover((select token from ids where name = 'b'), (v -> 1 ->> 'id')::uuid, false,
    'I returned all 20 chairs');

  begin
    perform public.respond_public_handover((select token from ids where name = 'b'), (v -> 0 ->> 'id')::uuid, false, 'changed my mind');
    raise exception 'expected a second response to fail';
  exception when others then
    if sqlerrm <> 'You have already responded to this record' then raise; end if;
  end;

  -- Another booking's link cannot touch these records.
  begin
    perform public.respond_public_handover((select token from ids where name = 'req'), (v -> 1 ->> 'id')::uuid, true);
    raise exception 'expected a cross-booking response to fail';
  exception when others then
    if sqlerrm <> 'Record not found' then raise; end if;
  end;

  -- Anonymous visitors cannot record handovers.
  begin
    perform public.record_checkout((select id from ids where name = 'req'), '[]', true);
    raise exception 'expected anon to be refused';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
do $$
begin
  assert (select status from public.bookings where id = (select id from ids where name = 'b')) = 'PROBLEM_OPEN',
    'disputing the return opens a problem';
  assert (select note from public.booking_events
          where booking_id = (select id from ids where name = 'b') order by id desc limit 1)
         = 'Customer disputed the return: I returned all 20 chairs', 'the dispute is in the history';
end $$;

\echo 'All checkout and return rule checks passed'
rollback;
