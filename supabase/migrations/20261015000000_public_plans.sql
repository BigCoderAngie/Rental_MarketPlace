-- The public homepage shows the Free, Pro and Business plans to visitors who
-- are not signed in, read from the same table as the plan page so prices
-- never disagree. Plan names, prices, limits and booking fees are public
-- information; visitors still cannot change plans or read platform_settings
-- (bank details), subscriptions or plan payments.

grant select on public.plans to anon;

create policy "visitors read plans" on public.plans
  for select to anon using (true);
