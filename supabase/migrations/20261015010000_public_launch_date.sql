-- The public homepage only offers founding prices while the launch is on, so
-- signed-out visitors need the launch end date. They get that one column:
-- bank details, eWallet details and the seller's name stay private.

grant select (launch_ends_on) on public.platform_settings to anon;

create policy "visitors read the launch date" on public.platform_settings
  for select to anon using (true);
