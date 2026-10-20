-- Plans (FR-PL-01 to FR-PL-05): Free limits, proof of payment, admin
-- approval for 12 months, renewals, lapsing back to Free, founding prices.
-- Run with: npm run test:db  (needs `npm run db:start` first)
-- Everything runs in one transaction that is rolled back at the end.

\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'other@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@test.local'),
  ('00000000-0000-0000-0000-00000000000d', 'staff@test.local');
insert into public.platform_admins (user_id) values ('00000000-0000-0000-0000-00000000000c');

create temporary table ids (name text primary key, id uuid) on commit drop;
grant all on ids to authenticated;

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

-- 1. A new business starts on Free, with founding prices during launch.
insert into ids select 'biz', b.id from public.create_business('Test Hire') b;

do $$
declare
  v public.subscriptions;
begin
  select * into v from public.subscriptions where business_id = (select id from ids where name = 'biz');
  assert v.plan_code = 'free' and v.expires_at is null, 'starts on Free';
  assert v.founding_until = current_date + 365 or v.founding_until = current_date + 366, 'founding for a year';
  assert (public.business_plan((select id from ids where name = 'biz'))).code = 'free', 'plan in force is Free';
  assert public.plan_price((select id from ids where name = 'biz'), 'pro') = 199, 'founding Pro price';
  assert public.plan_price((select id from ids where name = 'biz'), 'business') = 499, 'founding Business price';
end $$;

-- 2. Free allows 15 items. Removed items don't count.
insert into public.items (business_id, name, category, quantity_owned, daily_price)
select (select id from ids where name = 'biz'), 'Item ' || n, 'events', 1, 10
from generate_series(1, 15) n;

do $$
begin
  insert into public.items (business_id, name, category, quantity_owned, daily_price)
  values ((select id from ids where name = 'biz'), 'One too many', 'events', 1, 10);
  raise exception 'expected the 16th item to be refused';
exception when others then
  if sqlerrm <> 'Your Free plan allows 15 items. Upgrade your plan to add more.' then raise; end if;
end $$;

update public.items set archived = true where name = 'Item 1';
insert into public.items (business_id, name, category, quantity_owned, daily_price)
values ((select id from ids where name = 'biz'), 'Replacement', 'events', 1, 10);

do $$
begin
  update public.items set archived = false where name = 'Item 1';
  raise exception 'expected bringing back an item past the limit to be refused';
exception when others then
  if sqlerrm not like 'Your Free plan allows 15 items%' then raise; end if;
end $$;

-- 3. Free allows 1 user.
reset role;
do $$
begin
  insert into public.business_members (business_id, user_id, role)
  values ((select id from ids where name = 'biz'), '00000000-0000-0000-0000-00000000000d', 'staff');
  raise exception 'expected a second user to be refused on Free';
exception when others then
  if sqlerrm <> 'Your Free plan allows 1 users. Upgrade your plan to add more.' then raise; end if;
end $$;
set local role authenticated;

-- 4. Asking for a plan needs a paid plan and a proof in the business's folder.
do $$
begin
  perform public.request_plan((select id from ids where name = 'biz'), 'free', 'ewallet', null, 'x');
  raise exception 'expected Free to be refused';
exception when others then
  if sqlerrm <> 'Choose Pro or Business' then raise; end if;
end $$;
do $$
begin
  perform public.request_plan((select id from ids where name = 'biz'), 'pro', 'ewallet', null, '');
  raise exception 'expected a missing proof to be refused';
exception when others then
  if sqlerrm <> 'Add a photo or screenshot of your proof of payment' then raise; end if;
end $$;
do $$
begin
  perform public.request_plan((select id from ids where name = 'biz'), 'pro', 'ewallet', null,
                              '10000000-0000-0000-0000-000000000099/proof.jpg');
  raise exception 'expected a proof outside the business folder to be refused';
exception when check_violation then null;
end $$;

-- The owner uploads into their folder; another business can't.
insert into storage.objects (bucket_id, name)
select 'payment-proofs', id || '/proof.jpg' from ids where name = 'biz';

insert into ids select 'pay1', p.id from public.request_plan(
  (select id from ids where name = 'biz'), 'pro', 'bank_deposit', ' TH-123 ',
  (select id || '/proof.jpg' from ids where name = 'biz')) p;

do $$
declare
  v public.plan_payments;
begin
  select * into v from public.plan_payments where id = (select id from ids where name = 'pay1');
  assert v.status = 'PENDING' and v.amount = 199 and v.reference = 'TH-123', 'pending at the founding price';
  assert (public.business_plan(v.business_id)).code = 'free', 'still Free until approved';
end $$;

do $$
begin
  perform public.request_plan((select id from ids where name = 'biz'), 'business', 'ewallet', null,
                              (select id || '/proof.jpg' from ids where name = 'biz'));
  raise exception 'expected a second pending payment to be refused';
exception when others then
  if sqlerrm <> 'You already sent a payment that is waiting for approval' then raise; end if;
end $$;

-- 5. Another business can't see the payment, the proof, or ask for this business.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
do $$
begin
  assert (select count(*) from public.plan_payments) = 0, 'another business sees no payments';
  assert (select count(*) from storage.objects where bucket_id = 'payment-proofs') = 0, 'nor the proof';
  perform public.request_plan((select id from ids where name = 'biz'), 'pro', 'ewallet', null, 'x/y.jpg');
  raise exception 'expected another user to be refused';
exception when others then
  if sqlerrm <> 'Only the business owner can change the plan' then raise; end if;
end $$;
do $$
begin
  insert into storage.objects (bucket_id, name)
  select 'payment-proofs', id || '/sneaky.jpg' from ids where name = 'biz';
  raise exception 'expected an upload into another business folder to fail';
exception when insufficient_privilege then null;
end $$;

-- 6. Only admins review, and a rejection needs a reason.
do $$
begin
  perform public.review_plan_payment((select id from ids where name = 'pay1'), true);
  raise exception 'expected a non-admin to be refused';
exception when others then
  if sqlerrm <> 'Only platform admins can review payments' then raise; end if;
end $$;

set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
do $$
begin
  assert (select count(*) from storage.objects where bucket_id = 'payment-proofs') = 1, 'admins can open the proof';
  perform public.review_plan_payment((select id from ids where name = 'pay1'), false, ' ');
  raise exception 'expected a reason to be required';
exception when others then
  if sqlerrm <> 'Give a reason so the business knows what to fix' then raise; end if;
end $$;

-- 7. Approving switches Pro on for 12 months and numbers the invoice.
select public.review_plan_payment((select id from ids where name = 'pay1'), true);

do $$
declare
  v public.plan_payments;
  s public.subscriptions;
begin
  select * into v from public.plan_payments where id = (select id from ids where name = 'pay1');
  select * into s from public.subscriptions where business_id = v.business_id;
  assert v.status = 'APPROVED' and v.invoice_number like 'INV-%', 'approved with an invoice number';
  assert s.plan_code = 'pro' and s.expires_at = v.ends_at and v.ends_at = v.starts_at + interval '12 months',
    'Pro for 12 months';
  assert (public.business_plan(v.business_id)).code = 'pro', 'Pro is in force';
  perform public.review_plan_payment(v.id, true);
  raise exception 'expected a second review to be refused';
exception when others then
  if sqlerrm <> 'This payment was already reviewed' then raise; end if;
end $$;

-- Pro lifts the item limit and allows more users.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
update public.items set archived = false where name = 'Item 1';
reset role;
insert into public.business_members (business_id, user_id, role)
values ((select id from ids where name = 'biz'), '00000000-0000-0000-0000-00000000000d', 'staff');
set local role authenticated;

-- 8. Renewing the same plan adds 12 months to the end.
insert into ids select 'pay2', p.id from public.request_plan(
  (select id from ids where name = 'biz'), 'pro', 'ewallet', null,
  (select id || '/proof.jpg' from ids where name = 'biz')) p;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select public.review_plan_payment((select id from ids where name = 'pay2'), true, 'Thanks');

do $$
declare
  first_end timestamptz := (select ends_at from public.plan_payments where id = (select id from ids where name = 'pay1'));
  v public.plan_payments;
begin
  select * into v from public.plan_payments where id = (select id from ids where name = 'pay2');
  assert v.starts_at = first_end and v.ends_at = first_end + interval '12 months', 'renewal runs on from the end';
  assert (select expires_at from public.subscriptions where business_id = v.business_id) = v.ends_at, 'expiry moved';
end $$;

-- 9. A rejected payment tells the owner why; the plan doesn't change.
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
insert into ids select 'pay3', p.id from public.request_plan(
  (select id from ids where name = 'biz'), 'business', 'ewallet', null,
  (select id || '/proof.jpg' from ids where name = 'biz')) p;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
select public.review_plan_payment((select id from ids where name = 'pay3'), false, 'The amount on the slip is N$199, not N$499');
do $$
begin
  assert (select status from public.plan_payments where id = (select id from ids where name = 'pay3')) = 'REJECTED', 'rejected';
  assert (select invoice_number from public.plan_payments where id = (select id from ids where name = 'pay3')) is null, 'no invoice';
  assert (public.business_plan((select id from ids where name = 'biz'))).code = 'pro', 'still Pro';
end $$;

-- 10. When the plan ends the business is back on Free. Nothing is deleted,
--     but it can't add items past the Free limit.
reset role;
update public.subscriptions set expires_at = now() - interval '1 minute'
where business_id = (select id from ids where name = 'biz');
set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
do $$
begin
  assert (public.business_plan((select id from ids where name = 'biz'))).code = 'free', 'back on Free';
  assert (select count(*) from public.items where not archived) = 16, 'items are kept';
  insert into public.items (business_id, name, category, quantity_owned, daily_price)
  values ((select id from ids where name = 'biz'), 'After lapse', 'events', 1, 10);
  raise exception 'expected a new item past the Free limit to be refused';
exception when others then
  if sqlerrm not like 'Your Free plan allows 15 items%' then raise; end if;
end $$;

-- 11. After the founding year, the yearly price applies.
reset role;
update public.subscriptions set founding_until = current_date - 1
where business_id = (select id from ids where name = 'biz');
do $$
begin
  assert public.plan_price((select id from ids where name = 'biz'), 'pro') = 299, 'yearly Pro price';
end $$;

-- 12. Only admins change prices and limits; businesses can't set their own plan.
set local role authenticated;
update public.plans set yearly_price = 1 where code = 'pro';
update public.subscriptions set plan_code = 'business', expires_at = now() + interval '9 years';
do $$
begin
  assert (select yearly_price from public.plans where code = 'pro') = 299, 'owners cannot change prices';
  assert (public.business_plan((select id from ids where name = 'biz'))).code = 'free', 'owners cannot set their plan';
end $$;
set local request.jwt.claims to '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}';
update public.plans set yearly_price = 349 where code = 'pro';
do $$
begin
  assert (select yearly_price from public.plans where code = 'pro') = 349, 'admins change prices';
end $$;

reset role;
do $$
begin
  assert not has_table_privilege('anon', 'public.plan_payments', 'select'), 'visitors cannot read payments';
end $$;

-- 13. The public homepage: visitors read plans, but cannot change them or
--     read bank details, subscriptions or payments.
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
do $$
begin
  assert (select count(*) from public.plans) = 3, 'visitors read all three plans';
  begin
    update public.plans set yearly_price = 1 where code = 'pro';
    raise exception 'expected visitors to be refused changing prices';
  exception when insufficient_privilege then null;
  end;
  assert (select yearly_price from public.plans where code = 'pro') = 349, 'prices are unchanged';
  assert (select launch_ends_on from public.platform_settings) is not null, 'visitors read the launch date';
  begin
    perform bank_details from public.platform_settings;
    raise exception 'expected visitors to be refused bank details';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.subscriptions;
    raise exception 'expected visitors to be refused subscriptions';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

rollback;
