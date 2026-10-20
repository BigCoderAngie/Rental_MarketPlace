-- Business profile and account states (FR-AC-02, FR-AC-05, FR-PY-03):
-- profile fields, the logo bucket, profiles with phone and state, and the
-- payment details on the customer's links.
-- Run with: npm run test:db  (needs `npm run db:start` first)
-- Everything runs in one transaction that is rolled back at the end.

\set ON_ERROR_STOP on
begin;

-- A user who signs up gets a NEW profile with no phone.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'staff@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'outsider@test.local');

do $$
begin
  assert (select account_state from public.profiles where user_id = '00000000-0000-0000-0000-00000000000a') = 'NEW',
    'a new sign-up gets a NEW profile';
  assert (select phone from public.profiles where user_id = '00000000-0000-0000-0000-00000000000a') is null,
    'no phone yet';
end $$;

insert into public.businesses (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Test Hire'),
  ('10000000-0000-0000-0000-000000000002', 'Other Hire');
insert into public.business_members (business_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'owner'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'staff'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000c', 'owner');
insert into public.items (id, business_id, name, category, quantity_owned, daily_price) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 2, 500),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Chair', 'events', 50, 8);
update public.businesses set payment_details = 'Other Hire: cash only'
where id = '10000000-0000-0000-0000-000000000002';

create temporary table ids (name text primary key, token text) on commit drop;
grant select, insert on ids to authenticated;
grant select on ids to anon;

-- 1. The owner fills in the profile; staff can't change it.
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

update public.businesses
set opening_hours = 'Mon to Sat 8:00 to 17:00',
    bipa_number = 'CC/2020/01234',
    payment_details = 'FNB, Test Hire, account 62000000000, branch 280172',
    logo_path = '10000000-0000-0000-0000-000000000001/logo.png'
where id = '10000000-0000-0000-0000-000000000001';

set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
update public.businesses set payment_details = 'Pay me instead'
where id = '10000000-0000-0000-0000-000000000001';

do $$
begin
  assert (select payment_details from public.businesses where id = '10000000-0000-0000-0000-000000000001')
    = 'FNB, Test Hire, account 62000000000, branch 280172', 'staff cannot change the payment details';
end $$;

-- 2. A logo must sit directly in its own business's folder.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
do $$
begin
  update public.businesses set logo_path = '10000000-0000-0000-0000-000000000002/logo.png'
  where id = '10000000-0000-0000-0000-000000000001';
  raise exception 'expected a logo in another business folder to fail';
exception when check_violation then null;
end $$;
do $$
begin
  update public.businesses set logo_path = '10000000-0000-0000-0000-000000000001/../10000000-0000-0000-0000-000000000002/logo.png'
  where id = '10000000-0000-0000-0000-000000000001';
  raise exception 'expected a path that climbs out of the folder to fail';
exception when check_violation then null;
end $$;

-- 3. Only the owner uploads a logo, and only into their own folder.
insert into storage.objects (bucket_id, name)
values ('business-logos', '10000000-0000-0000-0000-000000000001/logo.png');

set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('business-logos', '10000000-0000-0000-0000-000000000001/staff-logo.png');
  raise exception 'expected staff to be refused a logo upload';
exception when insufficient_privilege then null;
end $$;

set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('business-logos', '10000000-0000-0000-0000-000000000001/sneaky.png');
  raise exception 'expected another business to be refused';
exception when insufficient_privilege then null;
end $$;

-- 4. set_my_phone checks the number and makes a NEW account ACTIVE.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
do $$
begin
  perform public.set_my_phone('call me');
  raise exception 'expected a non-number to be refused';
exception when others then
  if sqlerrm <> 'Enter a phone number, for example 081 123 4567' then raise; end if;
end $$;

select public.set_my_phone('081 123 4567');

do $$
declare
  v public.profiles;
begin
  select * into v from public.profiles where user_id = '00000000-0000-0000-0000-00000000000a';
  assert v.phone = '081 123 4567', 'phone saved';
  assert v.account_state = 'ACTIVE', 'NEW became ACTIVE';
end $$;

-- 5. Users see only their own profile and can't write to it directly.
do $$
begin
  assert (select count(*) from public.profiles) = 1, 'only my own profile is visible';
  begin
    update public.profiles set account_state = 'ACTIVE' where user_id = '00000000-0000-0000-0000-00000000000b';
    raise exception 'expected a direct profile update to be refused';
  exception when insufficient_privilege then null;
  end;
  begin
    truncate public.profiles;
    raise exception 'expected emptying profiles to be refused';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 6. The customer's links show the logo and how to pay, and nothing else
--    about the business table is readable signed out.
insert into ids
select 'booking', b.public_token from public.create_booking(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111',
  '2030-04-01', '2030-04-03',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]'
) b;
insert into ids
select 'quote', q.public_token from public.create_quote(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111',
  '2030-05-01', '2030-05-02',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]'
) q;

set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
insert into ids
select 'other', b.public_token from public.create_booking(
  '10000000-0000-0000-0000-000000000002', 'Ben', '0812222222',
  '2030-04-01', '2030-04-01',
  '[{"item_id": "20000000-0000-0000-0000-000000000002", "quantity": 10}]'
) b;

reset role;
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

do $$
declare
  v jsonb;
begin
  v := public.get_public_booking((select token from ids where name = 'other'));
  assert v -> 'business' ->> 'payment_details' = 'Other Hire: cash only',
    'each link shows only its own business''s payment details';
  assert v -> 'business' ->> 'name' = 'Other Hire', 'and its own business';

  v := public.get_public_booking((select token from ids where name = 'booking'));
  assert v -> 'business' ->> 'payment_details' = 'FNB, Test Hire, account 62000000000, branch 280172',
    'the booking link shows how to pay';
  assert v -> 'business' ->> 'logo_path' = '10000000-0000-0000-0000-000000000001/logo.png', 'and the logo';

  v := public.get_public_quote((select token from ids where name = 'quote'));
  assert v -> 'business' ->> 'payment_details' = 'FNB, Test Hire, account 62000000000, branch 280172',
    'the quote link shows how to pay';

  begin
    perform payment_details from public.businesses;
    raise exception 'expected visitors to be refused the businesses table';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.profiles;
    raise exception 'expected visitors to be refused profiles';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_my_phone('081 123 4567');
    raise exception 'expected visitors to be refused set_my_phone';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
