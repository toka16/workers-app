-- Hardening: the publishable key lets any signed-in worker write their own rows straight through
-- the REST API, bypassing the Server Actions. Everything the app validates is therefore re-checked
-- here, so the database stays the real trust boundary. Rules mirror src/domain/schemas.ts.

-- ---------------------------------------------------------------------------
-- Clean up rows that could only have been written around the app's validation
-- ---------------------------------------------------------------------------

update public.worker_profiles set facebook = 'https://' || substr(facebook, 8) where facebook ~* '^http://';

update public.worker_profiles set
  avatar_path   = case when avatar_path   ~ ('^' || id::text || '/[A-Za-z0-9._-]+$')
                         or avatar_path   ~ '^https://(picsum\.photos|i\.pravatar\.cc)/' then avatar_path end,
  phone         = case when phone         ~ '^\+?[0-9]{6,20}$' then phone end,
  whatsapp      = case when whatsapp      ~ '^\+?[0-9]{6,20}$' then whatsapp end,
  viber         = case when viber         ~ '^\+?[0-9]{6,20}$' then viber end,
  telegram      = case when telegram      ~ '^@?[A-Za-z0-9_]{3,64}$' then telegram end,
  contact_email = case when contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then contact_email end,
  facebook      = case when facebook      ~* '^https://([a-z0-9-]+\.)?(facebook|fb)\.com(/\S*)?$' then facebook end,
  website       = case when website       ~ '^https?://\S+\.\S+$' then website end;

delete from public.portfolio_images
where not (
  (path ~ ('^' || worker_id::text || '/[A-Za-z0-9._-]+$') and thumb_path ~ ('^' || worker_id::text || '/[A-Za-z0-9._-]+$'))
  or (path ~ '^https://picsum\.photos/' and thumb_path ~ '^https://picsum\.photos/')
);

-- ---------------------------------------------------------------------------
-- Formats
-- ---------------------------------------------------------------------------

-- Image paths must live in the owner's storage folder. Absolute URLs are only allowed for the demo
-- hosts used by supabase/seed.sql (see isDemoImageUrl in src/domain/models.ts).
alter table public.worker_profiles
  add constraint worker_profiles_avatar_path_owned check (
    avatar_path is null
    or avatar_path ~ ('^' || id::text || '/[A-Za-z0-9._-]+$')
    or avatar_path ~ '^https://(picsum\.photos|i\.pravatar\.cc)/'
  ),
  add constraint worker_profiles_phone_format    check (phone    ~ '^\+?[0-9]{6,20}$'),
  add constraint worker_profiles_whatsapp_format check (whatsapp ~ '^\+?[0-9]{6,20}$'),
  add constraint worker_profiles_viber_format    check (viber    ~ '^\+?[0-9]{6,20}$'),
  add constraint worker_profiles_telegram_format check (telegram ~ '^@?[A-Za-z0-9_]{3,64}$'),
  add constraint worker_profiles_email_format    check (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add constraint worker_profiles_facebook_format check (facebook ~* '^https://([a-z0-9-]+\.)?(facebook|fb)\.com(/\S*)?$'),
  add constraint worker_profiles_website_format  check (website  ~ '^https?://\S+\.\S+$');

alter table public.portfolio_images
  add constraint portfolio_images_paths_owned check (
    (path ~ ('^' || worker_id::text || '/[A-Za-z0-9._-]+$') and thumb_path ~ ('^' || worker_id::text || '/[A-Za-z0-9._-]+$'))
    or (path ~ '^https://picsum\.photos/' and thumb_path ~ '^https://picsum\.photos/')
  );

-- ---------------------------------------------------------------------------
-- Per-worker limits (MAX_PORTFOLIO_IMAGES / MAX_SERVICES in src/domain/models.ts)
-- ---------------------------------------------------------------------------

create function public.enforce_worker_limits() returns trigger
language plpgsql set search_path = '' as $$
declare
  max_rows int := tg_argv[0]::int;
  current_rows int;
begin
  -- Serialize inserts per worker so parallel requests can't race past the limit.
  perform pg_advisory_xact_lock(hashtext(tg_table_name || ':' || new.worker_id::text));
  execute format('select count(*) from public.%I where worker_id = $1', tg_table_name)
    into current_rows using new.worker_id;
  if current_rows >= max_rows then
    raise exception 'limit_reached: %', tg_table_name using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger portfolio_images_limit before insert on public.portfolio_images
  for each row execute function public.enforce_worker_limits('40');

create trigger worker_services_limit before insert on public.worker_services
  for each row execute function public.enforce_worker_limits('30');

-- ---------------------------------------------------------------------------
-- A published profile that loses its last city or category goes back to draft
-- ---------------------------------------------------------------------------

-- The app adds before it removes and refuses to empty a live profile; this covers direct API calls
-- and reference data removed by an admin.
create function public.unpublish_when_incomplete() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.worker_cities where worker_id = old.worker_id)
     or not exists (select 1 from public.worker_categories where worker_id = old.worker_id) then
    update public.worker_profiles set is_published = false where id = old.worker_id and is_published;
  end if;
  return null;
end;
$$;

create trigger worker_cities_keep_publishable after delete on public.worker_cities
  for each row execute function public.unpublish_when_incomplete();

create trigger worker_categories_keep_publishable after delete on public.worker_categories
  for each row execute function public.unpublish_when_incomplete();

-- ---------------------------------------------------------------------------
-- Search: bound the query text (the app already trims it to 100 characters)
-- ---------------------------------------------------------------------------

create or replace function public.search_workers(
  q text default null,
  category_slugs text[] default null,
  city_slugs text[] default null,
  price_max numeric default null,
  min_experience int default null,
  with_photos boolean default false,
  sort_by text default 'recommended',
  page_limit int default 12,
  page_offset int default 0
)
returns table (
  id uuid,
  slug text,
  full_name text,
  headline text,
  avatar_path text,
  years_experience smallint,
  city_slugs text[],
  category_slugs text[],
  min_price numeric,
  currency text,
  photo_count int,
  cover_thumb_path text,
  updated_at timestamptz,
  total_count bigint
)
language sql stable security invoker set search_path = '' as $$
  with words as (
    select '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
    from regexp_split_to_table(lower(btrim(left(coalesce(q, ''), 100))), '\s+') as w
    where w <> ''
  ),
  base as (
    select
      p.*,
      array(
        select c.slug from public.worker_cities wc join public.cities c on c.id = wc.city_id
        where wc.worker_id = p.id order by c.sort
      ) as w_cities,
      array(
        select c.slug from public.worker_categories wc join public.categories c on c.id = wc.category_id
        where wc.worker_id = p.id order by c.sort
      ) as w_categories,
      (select min(s.price_from) from public.worker_services s where s.worker_id = p.id and s.price_from is not null) as w_min_price,
      (select count(*)::int from public.portfolio_images i where i.worker_id = p.id) as w_photos,
      (select i.thumb_path from public.portfolio_images i where i.worker_id = p.id order by i.sort, i.created_at limit 1) as w_cover,
      (
        select string_agg(lower(c.name_ka || ' ' || c.name_en), ' ')
        from public.worker_categories wc join public.categories c on c.id = wc.category_id
        where wc.worker_id = p.id
      ) as w_category_text
    from public.worker_profiles p
    where p.is_published
  ),
  filtered as (
    select * from base b
    where (category_slugs is null or cardinality(category_slugs) = 0 or b.w_categories && category_slugs)
      and (city_slugs is null or cardinality(city_slugs) = 0 or b.w_cities && city_slugs)
      and (price_max is null or b.w_min_price <= price_max)
      and (min_experience is null or coalesce(b.years_experience, 0) >= min_experience)
      and (not coalesce(with_photos, false) or b.w_photos > 0)
      and not exists (
        select 1 from words
        where not (b.search_text || ' ' || coalesce(b.w_category_text, '')) like words.pattern
      )
  )
  select
    f.id, f.slug, f.full_name, f.headline, f.avatar_path, f.years_experience,
    f.w_cities, f.w_categories, f.w_min_price,
    (select s.currency::text from public.worker_services s where s.worker_id = f.id order by s.price_from nulls last limit 1),
    f.w_photos, f.w_cover, f.updated_at,
    count(*) over () as total_count
  from filtered f
  order by
    case when sort_by = 'price_asc' then f.w_min_price end asc nulls last,
    case when sort_by = 'price_desc' then f.w_min_price end desc nulls last,
    case when sort_by = 'experience' then f.years_experience end desc nulls last,
    case when sort_by = 'newest' then f.created_at end desc,
    case when sort_by = 'recommended' then (f.w_photos > 0)::int + (f.avatar_path is not null)::int + (f.w_min_price is not null)::int end desc,
    f.updated_at desc
  limit least(greatest(page_limit, 1), 48)
  offset greatest(page_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Privileges: API roles never need these, whatever Supabase's default grants say
-- ---------------------------------------------------------------------------

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;
