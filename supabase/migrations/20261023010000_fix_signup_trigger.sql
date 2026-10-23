-- Fixes the sign-up trigger from 20261023000000_signup_details.sql. There,
-- runs_hire_business was `coalesce(...) or v_kind = 'business'`, which is NULL
-- when no owner type is sent (false OR NULL is NULL in SQL). Renters never send
-- one, so their sign-up failed with "Database error saving new user". The rest
-- of the function is unchanged.

create or replace function public._create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_path text := m ->> 'signup_path';
  v_goal text := m ->> 'first_goal';
  v_kind text := m ->> 'owner_kind';
begin
  insert into public.profiles (
    user_id, phone, full_name, home_town, signup_path, first_goal,
    runs_hire_business, owner_kind, business_name, whatsapp_updates,
    terms_accepted_at, fee_acknowledged_at
  )
  values (
    new.id,
    nullif(left(trim(m ->> 'phone'), 20), ''),
    nullif(left(trim(m ->> 'full_name'), 120), ''),
    nullif(left(trim(m ->> 'home_town'), 60), ''),
    case when v_path in ('renter', 'owner') then v_path end,
    case when v_goal in ('rent', 'earn') then v_goal end,
    coalesce((m ->> 'runs_hire_business')::boolean, false) or coalesce(v_kind = 'business', false),
    case when v_kind in ('individual', 'business') then v_kind end,
    nullif(left(trim(m ->> 'business_name'), 120), ''),
    coalesce((m ->> 'whatsapp_updates')::boolean, false),
    case when (m ->> 'terms_accepted')::boolean then now() end,
    case when (m ->> 'fee_acknowledged')::boolean then now() end
  )
  on conflict (user_id) do nothing;
  return new;
exception
  -- A badly typed boolean must never stop someone signing up: keep the bare profile.
  when invalid_text_representation then
    insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
    return new;
end;
$$;
