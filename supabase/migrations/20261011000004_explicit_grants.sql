-- Explicit table privileges for the API roles. Older Supabase projects grant these by default,
-- newer ones may not; RLS policies still decide which rows each role can see or change.

grant usage on schema public to anon, authenticated;

grant select on public.cities, public.categories to anon, authenticated;
grant select on public.worker_profiles, public.worker_cities, public.worker_categories,
  public.worker_services, public.portfolio_images to anon, authenticated;

-- Owners write their own rows (enforced by RLS); profile columns are restricted in 20261011000002.
grant insert, update, delete on public.worker_cities, public.worker_categories,
  public.worker_services, public.portfolio_images to authenticated;
