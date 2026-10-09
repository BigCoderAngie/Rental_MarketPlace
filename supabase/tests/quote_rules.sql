-- Quote rules: building, the public link, and accepting from it.
-- Run with: npm run test:db  (needs `npm run db:start` first)
-- Everything runs in one transaction that is rolled back at the end.

\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'outsider@test.local');

insert into public.businesses (id, name, towns, whatsapp, payment_terms, terms, quote_validity_days) values
  ('10000000-0000-0000-0000-000000000001', 'Test Hire', '{Windhoek}', '+264811000000',
   '50% to confirm, balance on delivery', 'Items must be returned clean', 7);
insert into public.business_members (business_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'owner');

insert into public.items (id, business_id, name, category, quantity_owned, daily_price, deposit) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Chair', 'events', 10, 5, 2),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 1, 800, 1000);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

create temporary table ids (name text primary key, id uuid, token text) on commit drop;
grant select on ids to anon;

-- 1. Build a quote: 8 chairs and the tent for 2 days, delivery N$150, discount N$50.
insert into ids
select 'q1', q.id, q.public_token from public.create_quote(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111',
  '2030-03-10', '2030-03-11',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 8},
    {"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1}]',
  p_delivery_fee => 150, p_discount => 50
) q;

do $$
declare
  v jsonb;
begin
  assert length((select token from ids where name = 'q1')) = 32, 'token should be 32 hex characters';
  assert (select count(*) from public.bookings) = 0, 'a quote must not create a booking';

  v := public.get_public_quote((select token from ids where name = 'q1'));
  -- (8 x 5 + 800) x 2 days + 150 - 50 = 1780
  assert (v ->> 'total')::numeric = 1780, format('total should be 1780, got %s', v ->> 'total');
  assert (v ->> 'deposit_amount')::numeric = 1016, 'deposit should be 8 x 2 + 1000';
  assert v ->> 'status' = 'OPEN', 'new quote should be open';
  assert v -> 'business' ->> 'terms' = 'Items must be returned clean', 'quote shows business terms';
  assert jsonb_array_length(v -> 'items') = 2, 'quote lists both items';
  assert (select expires_at::date from public.quotes where id = (select id from ids where name = 'q1'))
         = (now() + interval '7 days')::date, 'quote expires after the business validity period';
end $$;

-- 2. A second quote for the only tent on the same dates (quotes never hold stock).
insert into ids
select 'q2', q.id, q.public_token from public.create_quote(
  '10000000-0000-0000-0000-000000000001', 'Ben', '', '2030-03-11', '2030-03-11',
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 1}]'
) q;

-- 3. Customers act without signing in.
reset role;
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

do $$
begin
  assert (select count(*) from public.quotes) = 0, 'anon must not read the quotes table';
  assert public.get_public_quote('not-a-real-token') is null, 'unknown link shows nothing';
end $$;

-- 4. Anna accepts: a booking request is created with the quote's prices and extras.
do $$
declare
  v_ref text;
begin
  v_ref := public.accept_public_quote((select token from ids where name = 'q1'), 'Anna K', '0811111111');
  assert v_ref like 'BK-%', 'accepting should return a booking reference';
end $$;

reset role;
do $$
declare
  b public.bookings;
begin
  select * into b from public.bookings
  where id = (select booking_id from public.quotes where id = (select id from ids where name = 'q1'));
  assert b.status = 'REQUESTED', 'an accepted quote becomes a booking request';
  assert b.delivery_fee = 150 and b.discount = 50 and b.deposit_amount = 1016, 'extras carry over';
  assert (select count(*) from public.booking_items where booking_id = b.id) = 2, 'lines carry over';
  assert (select full_name from public.customers where id = b.customer_id) = 'Anna K', 'customer recorded';
  assert (select status from public.quotes where id = (select id from ids where name = 'q1')) = 'ACCEPTED',
    'quote marked accepted';
end $$;

-- 5. A quote can only be accepted once.
set local role anon;
do $$
begin
  perform public.accept_public_quote((select token from ids where name = 'q1'), 'Anna K', '0811111111');
  raise exception 'expected a second accept to fail';
exception when others then
  if sqlerrm <> 'This quote has already been accepted' then raise; end if;
end $$;

-- 6. Once the business confirms Anna's booking, Ben's quote for the tent fails
--    the availability re-check.
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select public.accept_booking((select booking_id from public.quotes where id = (select id from ids where name = 'q1')));

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
do $$
begin
  perform public.accept_public_quote((select token from ids where name = 'q2'), 'Ben', '0812222222');
  raise exception 'expected the availability re-check to fail';
exception when others then
  if sqlerrm not like 'Not enough "Tent" on 2030-03-11%' then raise; end if;
end $$;

reset role;
do $$
begin
  assert (select status from public.quotes where id = (select id from ids where name = 'q2')) = 'OPEN',
    'a failed accept leaves the quote open';
  assert (select count(*) from public.bookings) = 1, 'a failed accept creates no booking';
end $$;

-- 7. Expired and cancelled quotes cannot be accepted.
update public.quotes set expires_at = now() - interval '1 minute'
where id = (select id from ids where name = 'q2');
set local role anon;
do $$
begin
  assert public.get_public_quote((select token from ids where name = 'q2')) ->> 'status' = 'EXPIRED',
    'past expiry reads as expired';
  perform public.accept_public_quote((select token from ids where name = 'q2'), 'Ben', '0812222222');
  raise exception 'expected expired quote to be refused';
exception when others then
  if sqlerrm not like 'This quote has expired%' then raise; end if;
end $$;

-- 8. Anonymous visitors cannot call staff functions; outsiders cannot cancel.
do $$
begin
  perform public.cancel_quote((select id from ids where name = 'q2'));
  raise exception 'expected anon to be refused';
exception when insufficient_privilege then null;
end $$;

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  perform public.cancel_quote((select id from ids where name = 'q2'));
  raise exception 'expected outsider to be refused';
exception when others then
  if sqlerrm <> 'Quote not found' then raise; end if;
end $$;

\echo 'All quote rule checks passed'
rollback;
