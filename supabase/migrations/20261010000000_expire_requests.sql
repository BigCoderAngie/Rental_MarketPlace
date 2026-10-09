-- FR-BK-04: booking requests nobody answers expire, so a customer isn't left
-- waiting and the request stops showing as open. Each request already gets
-- request_expires_at when it is made (now + the business's
-- request_expiry_hours, 24 by default); this job enforces it.

create function public.expire_unanswered_requests()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.bookings
    where status = 'REQUESTED' and request_expires_at < now()
    for update skip locked
  loop
    update public.bookings set status = 'EXPIRED', updated_at = now() where id = v_id;
    insert into public.booking_events (booking_id, from_status, to_status, note)
    values (v_id, 'REQUESTED', 'EXPIRED', 'Not answered in time');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- A request can't be accepted once its time is up, even if the job hasn't
-- run yet. The job runs every 15 minutes where pg_cron is available.
create or replace function public._refuse_expired_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'REQUESTED' and new.status = 'ACCEPTED'
     and old.request_expires_at < now() then
    raise exception 'This request has expired. Ask the customer to make a new one.';
  end if;
  return new;
end;
$$;

create trigger bookings_refuse_expired_request
  before update of status on public.bookings
  for each row execute function public._refuse_expired_request();

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron';
    execute $cron$select cron.schedule('expire-unanswered-requests', '*/15 * * * *',
                                       'select public.expire_unanswered_requests()')$cron$;
  end if;
end;
$$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.accept_public_quote(text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking(text) to anon, authenticated;
grant execute on function public.confirm_public_payment(text, uuid) to anon, authenticated;
grant execute on function public.get_public_handovers(text) to anon, authenticated;
grant execute on function public.respond_public_handover(text, uuid, boolean, text) to anon, authenticated;
revoke execute on function public.expire_unanswered_requests() from authenticated;
