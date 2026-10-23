-- Sign-up details from the build kit's two sign-up paths (docs/build-kit
-- 02-BUSINESS-RULES.md §16-17, build kit Part 4): full name, home town, what
-- the person wants to do first, owner type and business name, and when they
-- agreed to the Terms and Privacy Policy and to the booking fee.
--
-- The sign-up form sends these as user metadata with supabase.auth.signUp,
-- and the sign-up trigger copies them into the profile, so they are saved even
-- when the email still has to be confirmed. Accounts made before this change
-- keep empty values.

alter table public.profiles
  add column full_name text,
  add column home_town text,
  add column signup_path text check (signup_path in ('renter', 'owner')),
  add column first_goal text check (first_goal in ('rent', 'earn')),
  add column runs_hire_business boolean not null default false,
  add column owner_kind text check (owner_kind in ('individual', 'business')),
  add column business_name text,
  add column whatsapp_updates boolean not null default false,
  add column terms_accepted_at timestamptz,
  add column fee_acknowledged_at timestamptz;

-- Replaces the trigger function from 20261020000000_business_profile.sql.
-- Metadata is typed by the person signing up, so every value is checked here:
-- unknown choices become null, text is trimmed and capped, and the account
-- state is never taken from it.
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
    coalesce((m ->> 'runs_hire_business')::boolean, false) or v_kind = 'business',
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
