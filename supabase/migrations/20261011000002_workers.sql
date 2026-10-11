-- Worker profiles and everything a worker owns.
-- Security model: everything published is public, only the owner (auth.uid() = worker id) can change it.

create extension if not exists pg_trgm with schema extensions;

create type public.price_unit as enum ('fixed', 'hour', 'day', 'sqm', 'item', 'negotiable');

create table public.worker_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  full_name text not null default '' check (char_length(full_name) <= 120),
  headline text not null default '' check (char_length(headline) <= 160),
  bio text not null default '' check (char_length(bio) <= 4000),
  avatar_path text,
  years_experience smallint check (years_experience between 0 and 80),
  phone text check (char_length(phone) <= 32),
  contact_email text check (char_length(contact_email) <= 254),
  whatsapp text check (char_length(whatsapp) <= 32),
  viber text check (char_length(viber) <= 32),
  telegram text check (char_length(telegram) <= 64),
  facebook text check (char_length(facebook) <= 255),
  website text check (char_length(website) <= 255),
  is_published boolean not null default false,
  search_text text generated always as (
    lower(full_name || ' ' || headline || ' ' || bio)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index worker_profiles_published_idx on public.worker_profiles (is_published, updated_at desc);
create index worker_profiles_search_idx on public.worker_profiles using gin (search_text extensions.gin_trgm_ops);

create table public.worker_cities (
  worker_id uuid not null references public.worker_profiles (id) on delete cascade,
  city_id smallint not null references public.cities (id) on delete cascade,
  primary key (worker_id, city_id)
);
create index worker_cities_city_idx on public.worker_cities (city_id);

create table public.worker_categories (
  worker_id uuid not null references public.worker_profiles (id) on delete cascade,
  category_id smallint not null references public.categories (id) on delete cascade,
  primary key (worker_id, category_id)
);
create index worker_categories_category_idx on public.worker_categories (category_id);

create table public.worker_services (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles (id) on delete cascade,
  category_id smallint references public.categories (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  price_from numeric(10, 2) check (price_from >= 0),
  price_to numeric(10, 2) check (price_to >= 0),
  price_unit public.price_unit not null default 'fixed',
  currency char(3) not null default 'GEL',
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  check (price_to is null or price_from is null or price_to >= price_from),
  check (price_unit = 'negotiable' or price_from is not null)
);
create index worker_services_worker_idx on public.worker_services (worker_id, sort);

create table public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles (id) on delete cascade,
  path text not null,
  thumb_path text not null,
  caption text not null default '' check (char_length(caption) <= 200),
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index portfolio_images_worker_idx on public.portfolio_images (worker_id, sort);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger worker_profiles_touch before update on public.worker_profiles
  for each row execute function public.touch_updated_at();

-- Every new auth user gets a draft (unpublished) profile.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.worker_profiles (id, slug, full_name)
  values (
    new.id,
    'worker-' || substr(replace(new.id::text, '-', ''), 1, 10),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- A profile can only be published when it is useful to visitors.
create function public.check_profile_publishable() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.is_published then
    if btrim(new.full_name) = '' then
      raise exception 'profile_incomplete: name' using errcode = 'check_violation';
    end if;
    if coalesce(new.phone, new.whatsapp, new.viber, new.telegram, new.contact_email, new.facebook) is null then
      raise exception 'profile_incomplete: contact' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.worker_cities where worker_id = new.id) then
      raise exception 'profile_incomplete: city' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.worker_categories where worker_id = new.id) then
      raise exception 'profile_incomplete: category' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger worker_profiles_publishable before insert or update on public.worker_profiles
  for each row execute function public.check_profile_publishable();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.worker_profiles enable row level security;
alter table public.worker_cities enable row level security;
alter table public.worker_categories enable row level security;
alter table public.worker_services enable row level security;
alter table public.portfolio_images enable row level security;

-- Profiles: public when published, always visible to the owner. Only the owner may update.
-- Inserts happen through the auth trigger, deletes through delete_my_account().
create policy "published profiles are public"
  on public.worker_profiles for select to anon, authenticated
  using (is_published or id = (select auth.uid()));

create policy "owners update their profile"
  on public.worker_profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Column level privileges: owners can't touch id, generated or audit columns.
revoke insert, update, delete on public.worker_profiles from anon, authenticated;
grant update (
  slug, full_name, headline, bio, avatar_path, years_experience,
  phone, contact_email, whatsapp, viber, telegram, facebook, website, is_published
) on public.worker_profiles to authenticated;

-- Child tables share the same shape of policy.
do $$
declare
  t text;
begin
  foreach t in array array['worker_cities', 'worker_categories', 'worker_services', 'portfolio_images'] loop
    execute format($f$
      create policy "%1$s readable when profile is visible" on public.%1$I
        for select to anon, authenticated
        using (exists (
          select 1 from public.worker_profiles p
          where p.id = worker_id and (p.is_published or p.id = (select auth.uid()))
        ));
      create policy "%1$s insertable by owner" on public.%1$I
        for insert to authenticated with check (worker_id = (select auth.uid()));
      create policy "%1$s updatable by owner" on public.%1$I
        for update to authenticated
        using (worker_id = (select auth.uid()))
        with check (worker_id = (select auth.uid()));
      create policy "%1$s deletable by owner" on public.%1$I
        for delete to authenticated using (worker_id = (select auth.uid()));
      revoke insert, update, delete on public.%1$I from anon;
    $f$, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Search
-- ---------------------------------------------------------------------------

create function public.search_workers(
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
    from regexp_split_to_table(lower(btrim(coalesce(q, ''))), '\s+') as w
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

grant execute on function public.search_workers to anon, authenticated;

-- Aggregated numbers for the landing page.
create function public.platform_stats()
returns table (workers bigint, cities bigint, categories bigint)
language sql stable security invoker set search_path = '' as $$
  select
    (select count(*) from public.worker_profiles where is_published),
    (select count(distinct wc.city_id) from public.worker_cities wc
       join public.worker_profiles p on p.id = wc.worker_id where p.is_published),
    (select count(*) from public.categories);
$$;

grant execute on function public.platform_stats to anon, authenticated;

-- Workers may delete their own account (cascades to the profile and all owned rows).
-- Storage objects are removed by the client before calling this.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account from public, anon;
grant execute on function public.delete_my_account to authenticated;
