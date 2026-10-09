-- Item photos: one picture per item, shown in the inventory and on the
-- customer's quote (and later on the Phase 2 marketplace).
--
-- Photos live in the public "item-photos" bucket so quote pages can show them
-- without signing in. Paths start with the business id
-- (<business id>/items/<file>.jpg); only that business's members can upload or
-- delete in its folder.

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy "members upload item photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'item-photos'
    and public.is_business_member(public.storage_path_business(name))
  );

-- Anyone can view through the public URL; removing a file through the API
-- also needs read access, so members can read their folder.
create policy "members view item photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'item-photos'
    and public.is_business_member(public.storage_path_business(name))
  );

create policy "members delete item photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'item-photos'
    and public.is_business_member(public.storage_path_business(name))
  );

alter table public.items
  add column photo_path text
    check (photo_path is null or public.storage_path_business(photo_path) = business_id);

-- The customer's quote also shows each item's photo.
create or replace function public.get_public_quote(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'reference', q.reference,
    'status', case when q.status = 'OPEN' and q.expires_at < now() then 'EXPIRED'
                   else q.status::text end,
    'customer_name', q.customer_name,
    'customer_phone', q.customer_phone,
    'start_date', q.start_date,
    'end_date', q.end_date,
    'days', q.end_date - q.start_date + 1,
    'delivery_fee', q.delivery_fee,
    'setup_fee', q.setup_fee,
    'discount', q.discount,
    'deposit_amount', q.deposit_amount,
    'total', public.quote_total(q.id),
    'notes', q.notes,
    'expires_at', q.expires_at,
    'business', jsonb_build_object(
      'name', b.name,
      'towns', b.towns,
      'phone', b.phone,
      'whatsapp', b.whatsapp,
      'payment_terms', b.payment_terms,
      'terms', b.terms
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', i.name,
               'quantity', qi.quantity,
               'daily_price', qi.daily_price,
               'photo_path', i.photo_path
             ) order by i.name)
      from public.quote_items qi join public.items i on i.id = qi.item_id
      where qi.quote_id = q.id
    ), '[]'::jsonb)
  )
  from public.quotes q
  join public.businesses b on b.id = q.business_id
  where q.public_token = p_token;
$$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
grant execute on function public.confirm_public_payment(text, uuid) to anon, authenticated;
grant execute on function public.get_public_handovers(text) to anon, authenticated;
grant execute on function public.respond_public_handover(text, uuid, boolean, text) to anon, authenticated;
