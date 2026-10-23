-- One sign-up for everyone (one account rents and lists). People who signed up
-- to rent answer the owner questions and tick the booking fee box once, on
-- their first listing (build kit rules 16 and 17, MASTER-PLAN "One sign-up").
--
-- Saves the answers on the profile, and updates the owner's business: an
-- individual one becomes a hire business (with its name) when they say so,
-- but a hire business never turns back into an individual, so existing
-- businesses keep their tools.

create function public.acknowledge_owner_terms(p_owner_kind text, p_business_name text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(left(trim(p_business_name), 120), '');
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if p_owner_kind is null or p_owner_kind not in ('individual', 'business') then
    raise exception 'Choose how you are listing';
  end if;
  if p_owner_kind = 'business' and v_name is null then
    raise exception 'Enter your business name';
  end if;

  insert into public.profiles (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  -- Owners of a hire business stay 'business' whatever is picked, matching their business.
  if exists (
    select 1 from public.business_members bm join public.businesses b on b.id = bm.business_id
    where bm.user_id = auth.uid() and b.kind = 'business'
  ) then
    p_owner_kind := 'business';
    v_name := coalesce(v_name, (select b.name from public.business_members bm join public.businesses b on b.id = bm.business_id
                                where bm.user_id = auth.uid() and b.kind = 'business' order by bm.created_at limit 1));
  end if;

  update public.profiles
  set owner_kind = p_owner_kind,
      business_name = case when p_owner_kind = 'business' then v_name else business_name end,
      runs_hire_business = runs_hire_business or p_owner_kind = 'business',
      fee_acknowledged_at = coalesce(fee_acknowledged_at, now())
  where user_id = auth.uid();

  if p_owner_kind = 'business' then
    update public.businesses b
    set kind = 'business', name = v_name
    where b.kind = 'individual'
      and b.id in (select bm.business_id from public.business_members bm where bm.user_id = auth.uid() and bm.role = 'owner');
  end if;
end;
$$;

revoke execute on function public.acknowledge_owner_terms(text, text) from public, anon;
grant execute on function public.acknowledge_owner_terms(text, text) to authenticated;
