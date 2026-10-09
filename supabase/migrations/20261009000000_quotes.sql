-- Quotes and WhatsApp links (SRS 5.4, FR-QT-01 to FR-QT-05).
--
--   * Staff build a quote from items, quantities and dates, with optional
--     delivery, setup and discount lines. A quote never holds stock.
--   * Each quote has an unguessable link token. Anyone with the link can view
--     the quote and accept it without an account (FR-AC-04), through the two
--     public functions below; the quote tables themselves stay private.
--   * Accepting re-checks availability (FR-QT-04) and turns the quote into a
--     booking request for the business to accept (FR-QT-05). Quotes the
--     business creates are direct bookings, so no marketplace fee applies.

-- ---------------------------------------------------------------------------
-- Business details shown on quotes
-- ---------------------------------------------------------------------------

alter table public.businesses
  add column quote_validity_days integer not null default 7
    check (quote_validity_days between 1 and 90),
  add column payment_terms text,
  add column terms text;

-- Extra charges carried from an accepted quote onto its booking.
alter table public.bookings
  add column delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  add column setup_fee numeric(12, 2) not null default 0 check (setup_fee >= 0),
  add column discount numeric(12, 2) not null default 0 check (discount >= 0);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create type public.quote_status as enum ('OPEN', 'ACCEPTED', 'CANCELLED');

create sequence public.quote_reference_seq;

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default 'QT-' || lpad(nextval('public.quote_reference_seq')::text, 6, '0'),
  -- 122 random bits; the only key to the public quote page.
  public_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_name text not null check (length(trim(customer_name)) > 0),
  customer_phone text,
  start_date date not null,
  end_date date not null,
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  setup_fee numeric(12, 2) not null default 0 check (setup_fee >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  deposit_amount numeric(12, 2) not null default 0 check (deposit_amount >= 0),
  notes text,
  status public.quote_status not null default 'OPEN',
  expires_at timestamptz not null,
  booking_id uuid references public.bookings (id),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index quotes_business_idx on public.quotes (business_id, created_at desc);

create table public.quote_items (
  quote_id uuid not null references public.quotes (id) on delete cascade,
  item_id uuid not null references public.items (id),
  quantity integer not null check (quantity > 0),
  daily_price numeric(12, 2) not null check (daily_price >= 0),
  primary key (quote_id, item_id)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Rental for all lines over the inclusive date range, plus extras, less discount.
create function public.quote_total(p_quote_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    coalesce(sum(qi.quantity * qi.daily_price), 0) * (q.end_date - q.start_date + 1)
      + q.delivery_fee + q.setup_fee - q.discount,
    0
  )
  from public.quotes q
  left join public.quote_items qi on qi.quote_id = q.id
  where q.id = p_quote_id
  group by q.id;
$$;

-- ---------------------------------------------------------------------------
-- Staff API
-- ---------------------------------------------------------------------------

-- FR-QT-01: build a quote. p_lines is [{"item_id": "...", "quantity": 10}].
create function public.create_quote(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_start_date date,
  p_end_date date,
  p_lines jsonb,
  p_delivery_fee numeric default 0,
  p_setup_fee numeric default 0,
  p_discount numeric default 0,
  p_notes text default null
)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses;
  v_quote public.quotes;
  v_line_count integer;
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;

  if p_end_date < p_start_date then
    raise exception 'The end date must be on or after the start date';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Add at least one item';
  end if;

  select * into v_business from public.businesses where id = p_business_id;

  insert into public.quotes (
    business_id, customer_name, customer_phone, start_date, end_date,
    delivery_fee, setup_fee, discount, notes, expires_at, created_by
  )
  values (
    p_business_id, trim(p_customer_name), nullif(trim(p_customer_phone), ''),
    p_start_date, p_end_date,
    coalesce(p_delivery_fee, 0), coalesce(p_setup_fee, 0), coalesce(p_discount, 0),
    p_notes, now() + make_interval(days => v_business.quote_validity_days), auth.uid()
  )
  returning * into v_quote;

  insert into public.quote_items (quote_id, item_id, quantity, daily_price)
  select v_quote.id, i.id, (line ->> 'quantity')::integer, i.daily_price
  from jsonb_array_elements(p_lines) as line
  join public.items i
    on i.id = (line ->> 'item_id')::uuid
   and i.business_id = p_business_id
   and not i.archived;

  get diagnostics v_line_count = row_count;
  if v_line_count <> jsonb_array_length(p_lines) then
    raise exception 'One or more items do not belong to this business';
  end if;

  update public.quotes q
  set deposit_amount = (
    select coalesce(sum(i.deposit * qi.quantity), 0)
    from public.quote_items qi join public.items i on i.id = qi.item_id
    where qi.quote_id = q.id
  )
  where q.id = v_quote.id
  returning * into v_quote;

  return v_quote;
end;
$$;

create function public.cancel_quote(p_quote_id uuid)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public.quotes;
begin
  select * into v_quote from public.quotes where id = p_quote_id for update;

  if not found or not public.is_business_member(v_quote.business_id) then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if v_quote.status <> 'OPEN' then
    raise exception 'Only an open quote can be cancelled';
  end if;

  update public.quotes set status = 'CANCELLED' where id = p_quote_id
  returning * into v_quote;
  return v_quote;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public API (the quote link; callable without signing in)
-- ---------------------------------------------------------------------------

-- FR-QT-03: everything the customer's quote page shows, or null for an unknown
-- link. Status reads EXPIRED once an open quote passes its expiry time.
create function public.get_public_quote(p_token text)
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
               'daily_price', qi.daily_price
             ) order by i.name)
      from public.quote_items qi join public.items i on i.id = qi.item_id
      where qi.quote_id = q.id
    ), '[]'::jsonb)
  )
  from public.quotes q
  join public.businesses b on b.id = q.business_id
  where q.public_token = p_token;
$$;

-- FR-QT-04 / FR-QT-05: the customer accepts from the link. Re-checks that the
-- items are still free, then creates a booking request (REQUESTED, which does
-- not hold stock) for the business to accept. Returns the booking reference.
create function public.accept_public_quote(
  p_token text,
  p_customer_name text,
  p_customer_phone text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public.quotes;
  v_business public.businesses;
  v_customer_id uuid;
  v_booking public.bookings;
begin
  select * into v_quote from public.quotes where public_token = p_token for update;

  if not found then
    raise exception 'Quote not found' using errcode = 'P0002';
  end if;
  if v_quote.status = 'ACCEPTED' then
    raise exception 'This quote has already been accepted';
  end if;
  if v_quote.status = 'CANCELLED' then
    raise exception 'This quote was withdrawn by the business';
  end if;
  if v_quote.expires_at < now() then
    raise exception 'This quote has expired. Ask the business for a new one.';
  end if;
  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = '' then
    raise exception 'Enter your name and phone number';
  end if;

  select * into v_business from public.businesses where id = v_quote.business_id;

  insert into public.customers (business_id, full_name, phone)
  values (v_quote.business_id, trim(p_customer_name), trim(p_customer_phone))
  on conflict (business_id, phone) do update set full_name = excluded.full_name
  returning id into v_customer_id;

  insert into public.bookings (
    business_id, customer_id, source, status, start_date, end_date,
    deposit_amount, delivery_fee, setup_fee, discount, notes, request_expires_at
  )
  values (
    v_quote.business_id, v_customer_id, 'direct', 'REQUESTED',
    v_quote.start_date, v_quote.end_date, v_quote.deposit_amount,
    v_quote.delivery_fee, v_quote.setup_fee, v_quote.discount, v_quote.notes,
    now() + make_interval(hours => v_business.request_expiry_hours)
  )
  returning * into v_booking;

  insert into public.booking_items (booking_id, item_id, quantity, daily_price)
  select v_booking.id, item_id, quantity, daily_price
  from public.quote_items where quote_id = v_quote.id;

  -- Raises (and rolls everything back) if the items are no longer free.
  perform public._assert_booking_fits(v_booking.id);

  insert into public.booking_events (booking_id, from_status, to_status, note)
  values (v_booking.id, null, 'REQUESTED', 'Customer accepted quote ' || v_quote.reference);

  update public.quotes
  set status = 'ACCEPTED', booking_id = v_booking.id
  where id = v_quote.id;

  return v_booking.reference;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security and grants
-- ---------------------------------------------------------------------------

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

-- Read-only to staff; writes go through the functions above.
create policy "members read quotes" on public.quotes
  for select to authenticated using (public.is_business_member(business_id));
create policy "members read quote items" on public.quote_items
  for select to authenticated using (
    exists (select 1 from public.quotes q
            where q.id = quote_id and public.is_business_member(q.business_id))
  );

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
revoke execute on function public.quote_total(uuid) from authenticated;
