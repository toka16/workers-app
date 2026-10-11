-- Run with: pnpm db:test  (supabase test db)
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Fixtures: two workers (A published-ready, B draft) created through the real auth trigger.
insert into auth.users (id, email, aud, role, instance_id)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.dev', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@test.dev', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');

select is(
  (select count(*)::int from public.worker_profiles where id in ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002')),
  2, 'signup trigger creates draft profiles');

-- ---------------------------------------------------------------- worker A
set local role authenticated;
set local request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ update public.worker_profiles set is_published = true where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '23514', null, 'cannot publish an incomplete profile');

update public.worker_profiles
  set full_name = 'Worker A', phone = '+995555000001'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.worker_cities (worker_id, city_id) select 'aaaaaaaa-0000-0000-0000-000000000001', id from public.cities where slug = 'tbilisi';
insert into public.worker_categories (worker_id, category_id) select 'aaaaaaaa-0000-0000-0000-000000000001', id from public.categories where slug = 'plumbing';
insert into public.worker_services (worker_id, title, price_from) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Fix tap', 30);

select lives_ok(
  $$ update public.worker_profiles set is_published = true where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'owner can publish a complete profile');

select is(
  (select count(*)::int from public.worker_profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  0, 'other workers'' drafts are hidden');

update public.worker_profiles set full_name = 'pwned' where id = 'bbbbbbbb-0000-0000-0000-000000000002';
select throws_ok(
  $$ insert into public.worker_services (worker_id, title, price_from) values ('bbbbbbbb-0000-0000-0000-000000000002', 'x', 1) $$,
  '42501', null, 'cannot add services to another worker');
select throws_ok(
  $$ insert into public.worker_cities (worker_id, city_id) values ('bbbbbbbb-0000-0000-0000-000000000002', 1) $$,
  '42501', null, 'cannot add cities to another worker');
select throws_ok(
  $$ update public.worker_profiles set created_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '42501', null, 'audit columns are not writable');
select throws_ok(
  $$ insert into public.cities (slug, name_ka, name_en) values ('x', 'x', 'x') $$,
  '42501', null, 'reference data is read only');

-- ---------------------------------------------------------------- worker B
set local request.jwt.claims = '{"sub": "bbbbbbbb-0000-0000-0000-000000000002", "role": "authenticated"}';

select is(
  (select full_name from public.worker_profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  '', 'worker A''s update of B was a no-op');

update public.worker_profiles set full_name = 'pwned' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
delete from public.worker_services where worker_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.worker_services where worker_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1, 'cannot delete another worker''s services');

select lives_ok(
  $$ update public.worker_profiles set headline = 'Draft' where id = 'bbbbbbbb-0000-0000-0000-000000000002' $$,
  'owner can edit own draft');

-- ---------------------------------------------------------------- anonymous visitor
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select is(
  (select full_name from public.worker_profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'Worker A', 'published profile is public and untouched');
select is(
  (select count(*)::int from public.worker_profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  0, 'drafts are not public');
select ok(
  exists (select 1 from public.search_workers(city_slugs => array['tbilisi']) where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'published worker appears in search');
select throws_ok(
  $$ update public.worker_profiles set full_name = 'x' $$,
  '42501', null, 'anon cannot update profiles');
select throws_ok(
  $$ select public.delete_my_account() $$,
  '42501', null, 'anon cannot call delete_my_account');

select * from finish();
rollback;
