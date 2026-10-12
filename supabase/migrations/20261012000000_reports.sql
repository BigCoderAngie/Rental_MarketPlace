-- Reports (SRS 5.13, FR-RP-01): revenue recorded, bookings, utilisation per
-- item, outstanding payments, deposits held and top customers.
--
--   * One read-only function returns everything for a date range, so the
--     reports page and the CSV download show the same numbers.
--   * Money comes only from the payment records (by the day it was paid);
--     the platform never holds money, so "revenue" means what the business
--     recorded.
--   * Bookings that went ahead are every booking that was accepted, whatever
--     happened next; requests that were declined, expired or cancelled are
--     counted but not valued.

create function public.business_report(p_business_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days integer;
  v_went_ahead public.booking_status[] := array[
    'ACCEPTED', 'FEE_PENDING', 'CONFIRMED', 'CHECKED_OUT', 'OVERDUE',
    'RETURNED', 'PROBLEM_OPEN', 'CLOSED'
  ]::public.booking_status[];
begin
  if not public.is_business_member(p_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'The end date must be on or after the start date';
  end if;
  if p_to - p_from > 366 then
    raise exception 'Choose a period of a year or less';
  end if;
  v_days := p_to - p_from + 1;

  return jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'days', v_days,

    -- Money recorded with a payment date in the period.
    'revenue', (
      select jsonb_build_object(
        'rental_received', coalesce(sum(amount) filter (where kind = 'RENTAL'), 0),
        'refunded', coalesce(sum(amount) filter (where kind = 'REFUND'), 0),
        'deposits_kept', coalesce(sum(amount) filter (where kind = 'DEPOSIT_DEDUCTED'), 0),
        'total', coalesce(sum(amount) filter (where kind in ('RENTAL', 'DEPOSIT_DEDUCTED')), 0)
                 - coalesce(sum(amount) filter (where kind = 'REFUND'), 0),
        'by_method', coalesce((
          select jsonb_agg(jsonb_build_object('method', m.method, 'amount', m.amount) order by m.amount desc)
          from (
            select method::text,
                   sum(case when kind = 'REFUND' then -amount else amount end) as amount
            from public.payments
            where business_id = p_business_id and voided_at is null
              and paid_on between p_from and p_to
              and kind in ('RENTAL', 'REFUND')
            group by method
          ) m
        ), '[]'::jsonb)
      )
      from public.payments
      where business_id = p_business_id and voided_at is null
        and paid_on between p_from and p_to
    ),

    -- Bookings starting in the period, by status.
    'bookings', (
      select jsonb_build_object(
        'count', count(*),
        'went_ahead', count(*) filter (where status = any (v_went_ahead)),
        'value', coalesce(sum(public.booking_total(id)) filter (where status = any (v_went_ahead)), 0),
        'by_status', coalesce((
          select jsonb_object_agg(s.status, s.n)
          from (
            select status::text, count(*) as n
            from public.bookings
            where business_id = p_business_id and start_date between p_from and p_to
            group by status
          ) s
        ), '{}'::jsonb)
      )
      from public.bookings
      where business_id = p_business_id and start_date between p_from and p_to
    ),

    -- Unit-days booked in the period out of unit-days in service.
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', u.name,
               'in_service', u.in_service,
               'unit_days_booked', u.unit_days,
               'utilisation', case when u.in_service > 0
                                   then round(100.0 * u.unit_days / (u.in_service * v_days), 1)
                                   else 0 end
             ) order by u.unit_days desc, u.name)
      from (
        select i.name, i.archived,
               i.quantity_owned - i.units_out_of_service as in_service,
               coalesce((
                 select sum(bi.quantity * (least(b.end_date, p_to) - greatest(b.start_date, p_from) + 1))
                 from public.booking_items bi
                 join public.bookings b on b.id = bi.booking_id
                 where bi.item_id = i.id
                   and b.status = any (v_went_ahead)
                   and b.start_date <= p_to and b.end_date >= p_from
               ), 0)::integer as unit_days
        from public.items i
        where i.business_id = p_business_id
      ) u
      -- Removed items appear only if they were booked in the period.
      where u.unit_days > 0 or not u.archived
    ), '[]'::jsonb),

    -- Right now, not limited to the period: money still owed on bookings
    -- that went ahead, and deposits not yet returned or kept.
    'outstanding', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', b.id,
               'reference', b.reference,
               'customer', c.full_name,
               'start_date', b.start_date,
               'status', b.status,
               'amount', bb.outstanding
             ) order by b.start_date, b.reference)
      from public.bookings b
      join public.booking_balances bb on bb.booking_id = b.id
      join public.customers c on c.id = b.customer_id
      where b.business_id = p_business_id
        and b.status = any (v_went_ahead)
        and bb.outstanding > 0
    ), '[]'::jsonb),

    'deposits_held', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', b.id,
               'reference', b.reference,
               'customer', c.full_name,
               'end_date', b.end_date,
               'status', b.status,
               'amount', bb.deposit_held
             ) order by b.end_date, b.reference)
      from public.bookings b
      join public.booking_balances bb on bb.booking_id = b.id
      join public.customers c on c.id = b.customer_id
      where b.business_id = p_business_id
        and bb.deposit_held > 0
    ), '[]'::jsonb),

    -- Customers by the value of their bookings that went ahead in the period.
    'top_customers', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.full_name, 'phone', t.phone,
                                          'bookings', t.bookings, 'value', t.value)
                       order by t.value desc, t.full_name)
      from (
        select c.full_name, c.phone, count(*) as bookings, sum(public.booking_total(b.id)) as value
        from public.bookings b
        join public.customers c on c.id = b.customer_id
        where b.business_id = p_business_id
          and b.status = any (v_went_ahead)
          and b.start_date between p_from and p_to
        group by c.id
        order by value desc, c.full_name
        limit 10
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
grant execute on function public.confirm_public_payment(text, uuid) to anon, authenticated;
grant execute on function public.get_public_handovers(text) to anon, authenticated;
grant execute on function public.respond_public_handover(text, uuid, boolean, text) to anon, authenticated;
