-- FR-BK-07: change a booking's dates or quantities before it goes out.
--
-- The change is all or nothing: the new dates and items replace the old ones
-- and, for bookings that hold stock, the double-booking check runs again on
-- the new version (ignoring the booking's own old units). If anything doesn't
-- fit, nothing changes. Items already on the booking keep the price they were
-- booked at; newly added items take today's price.

create function public.update_booking(
  p_booking_id uuid,
  p_start_date date,
  p_end_date date,
  p_lines jsonb,
  p_note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_old_start date;
  v_old_end date;
  v_old_items text;
  v_new_items text;
  v_changes text[] := '{}';
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if not found or not public.is_business_member(v_booking.business_id) then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  if v_booking.status not in ('REQUESTED', 'ACCEPTED', 'FEE_PENDING', 'CONFIRMED') then
    raise exception 'A % booking can no longer be changed', lower(replace(v_booking.status::text, '_', ' '));
  end if;

  if p_start_date is null or p_end_date is null then
    raise exception 'Choose the dates';
  end if;
  if p_end_date < p_start_date then
    raise exception 'The end date must be on or after the start date';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array'
     or not exists (select 1 from jsonb_array_elements(p_lines) l where (l ->> 'quantity')::integer > 0) then
    raise exception 'Add at least one item';
  end if;
  if exists (select 1 from jsonb_array_elements(p_lines) l where (l ->> 'quantity')::integer < 0) then
    raise exception 'Quantities cannot be negative';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_lines) l
    where (l ->> 'quantity')::integer > 0
      and not exists (
        select 1 from public.items i
        where i.id = (l ->> 'item_id')::uuid and i.business_id = v_booking.business_id
          and (not i.archived
               or exists (select 1 from public.booking_items bi
                          where bi.booking_id = p_booking_id and bi.item_id = i.id))
      )
  ) then
    raise exception 'One or more items do not belong to this business';
  end if;

  -- What changed, for the history.
  v_old_start := v_booking.start_date;
  v_old_end := v_booking.end_date;
  select string_agg(bi.quantity || ' × ' || i.name, ', ' order by i.name) into v_old_items
  from public.booking_items bi join public.items i on i.id = bi.item_id
  where bi.booking_id = p_booking_id;

  -- Replace the lines, keeping the booked price for items already on it.
  delete from public.booking_items bi
  where bi.booking_id = p_booking_id
    and not exists (
      select 1 from jsonb_array_elements(p_lines) l
      where (l ->> 'item_id')::uuid = bi.item_id and (l ->> 'quantity')::integer > 0
    );

  insert into public.booking_items (booking_id, item_id, quantity, daily_price)
  select p_booking_id, n.item_id, n.quantity, i.daily_price
  from (
    select (l ->> 'item_id')::uuid as item_id, sum((l ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_lines) l
    where (l ->> 'quantity')::integer > 0
    group by 1
  ) n
  join public.items i on i.id = n.item_id
  on conflict (booking_id, item_id) do update set quantity = excluded.quantity;

  update public.bookings b
  set start_date = p_start_date,
      end_date = p_end_date,
      deposit_amount = (
        select coalesce(sum(i.deposit * bi.quantity), 0)
        from public.booking_items bi join public.items i on i.id = bi.item_id
        where bi.booking_id = b.id
      ),
      updated_at = now()
  where b.id = p_booking_id
  returning * into v_booking;

  if public.booking_holds_stock(v_booking.status) then
    perform public._assert_booking_fits(p_booking_id);
  end if;

  select string_agg(bi.quantity || ' × ' || i.name, ', ' order by i.name) into v_new_items
  from public.booking_items bi join public.items i on i.id = bi.item_id
  where bi.booking_id = p_booking_id;

  if v_old_start <> p_start_date or v_old_end <> p_end_date then
    v_changes := v_changes || format('dates %s to %s (were %s to %s)',
      to_char(p_start_date, 'DD Mon'), to_char(p_end_date, 'DD Mon'),
      to_char(v_old_start, 'DD Mon'), to_char(v_old_end, 'DD Mon'));
  end if;
  if v_old_items is distinct from v_new_items then
    v_changes := v_changes || format('items %s (were %s)', v_new_items, v_old_items);
  end if;
  if cardinality(v_changes) = 0 then
    raise exception 'Nothing was changed';
  end if;

  insert into public.booking_events (booking_id, from_status, to_status, note, actor)
  values (
    p_booking_id, v_booking.status, v_booking.status,
    'Changed ' || array_to_string(v_changes, '; ')
      || coalesce('. ' || nullif(trim(p_note), ''), ''),
    auth.uid()
  );

  return v_booking;
end;
$$;

-- The edit screen shows what is free for the new dates without counting the
-- booking's own units, so item_availability takes an optional booking to leave
-- out.
drop function public.item_availability(uuid, date, date);

create function public.item_availability(
  p_business_id uuid,
  p_from date,
  p_to date,
  p_exclude_booking uuid default null
)
returns table (
  item_id uuid,
  day date,
  in_service integer,
  booked integer,
  available integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;
  if p_to < p_from or p_to - p_from > 366 then
    raise exception 'Choose a range of at most one year';
  end if;

  return query
  with biz_items as (
    select i.id, i.quantity_owned - i.units_out_of_service as in_service
    from public.items i
    where i.business_id = p_business_id and not i.archived
  )
  select bi.id, d.day::date, bi.in_service,
         coalesce(bu.booked, 0),
         bi.in_service - coalesce(bu.booked, 0)
  from biz_items bi
  cross join generate_series(p_from, p_to, interval '1 day') as d (day)
  left join public._booked_units(
    array(select id from biz_items), p_from, p_to, p_exclude_booking
  ) bu on bu.item_id = bi.id and bu.day = d.day::date
  order by bi.id, d.day;
end;
$$;

grant execute on function public.item_availability(uuid, date, date, uuid) to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
grant execute on function public.confirm_public_payment(text, uuid) to anon, authenticated;
grant execute on function public.get_public_handovers(text) to anon, authenticated;
grant execute on function public.respond_public_handover(text, uuid, boolean, text) to anon, authenticated;
