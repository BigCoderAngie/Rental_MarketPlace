-- Customer list (SRS 1.2 "customer history", data model "customers").
--
-- One row per customer with their booking history in numbers, for the
-- customer list and customer page. Uses the caller's own permissions, so
-- staff only ever see their own business's customers.

create view public.customer_summaries
with (security_invoker = true)
as
select
  c.id,
  c.business_id,
  c.full_name,
  c.phone,
  c.notes,
  c.created_at,
  -- Bookings that went ahead (accepted, whatever happened next).
  count(b.id) filter (where b.status not in ('REQUESTED', 'DECLINED', 'EXPIRED', 'CANCELLED')) as bookings,
  count(b.id) as all_bookings,
  max(b.start_date) as last_booking_date,
  coalesce(sum(bb.amount_due) filter (where b.status not in ('REQUESTED', 'DECLINED', 'EXPIRED', 'CANCELLED')), 0)
    as total_value,
  coalesce(sum(bb.outstanding) filter (where b.status not in ('REQUESTED', 'DECLINED', 'EXPIRED', 'CANCELLED')
                                         and bb.outstanding > 0), 0) as outstanding,
  coalesce(sum(bb.deposit_held), 0) as deposit_held
from public.customers c
left join public.bookings b on b.customer_id = c.id
left join public.booking_balances bb on bb.booking_id = b.id
group by c.id;

revoke all on public.customer_summaries from anon;
grant select on public.customer_summaries to authenticated;
