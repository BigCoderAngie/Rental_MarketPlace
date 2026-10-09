-- Item photos: storage folders per business, and photos on the customer's quote.
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
insert into public.items (id, business_id, name, category, quantity_owned, daily_price) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Tent', 'events', 2, 500);

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

-- 1. Staff upload into their own business folder, not another's.
insert into storage.objects (bucket_id, name)
values ('item-photos', '10000000-0000-0000-0000-000000000001/items/tent.jpg');

do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('item-photos', '10000000-0000-0000-0000-000000000002/items/sneaky.jpg');
  raise exception 'expected an upload into another business folder to fail';
exception when insufficient_privilege then null;
end $$;

-- 2. An item's photo must be in its own business's folder.
update public.items set photo_path = '10000000-0000-0000-0000-000000000001/items/tent.jpg'
where id = '20000000-0000-0000-0000-000000000001';

do $$
begin
  update public.items set photo_path = '10000000-0000-0000-0000-000000000002/items/x.jpg'
  where id = '20000000-0000-0000-0000-000000000001';
  raise exception 'expected a photo from another business folder to fail';
exception when check_violation then null;
end $$;

-- 3. Only this business can reach the file through storage, which removing it
--    needs. (Supabase refuses SQL deletes on storage tables, so this checks
--    the read rule that the Storage API's delete goes through.)
do $$
begin
  assert (select count(*) from storage.objects where bucket_id = 'item-photos') = 1,
    'the owner can reach their photo';
end $$;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  assert (select count(*) from storage.objects where bucket_id = 'item-photos') = 0,
    'another business cannot reach the photo';
end $$;

-- 4. The customer's quote shows the photo.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
create temporary table ids (token text) on commit drop;
grant select on ids to anon;
insert into ids select q.public_token from public.create_quote(
  '10000000-0000-0000-0000-000000000001', 'Anna', '0811111111', '2030-03-10', '2030-03-10',
  '[{"item_id": "20000000-0000-0000-0000-000000000001", "quantity": 1}]') q;

reset role;
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
do $$
begin
  assert public.get_public_quote((select token from ids)) -> 'items' -> 0 ->> 'photo_path'
         = '10000000-0000-0000-0000-000000000001/items/tent.jpg', 'quote items carry the photo';
end $$;

\echo 'All item photo checks passed'
rollback;
