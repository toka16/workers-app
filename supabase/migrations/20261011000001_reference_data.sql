-- Reference data managed by admins (via migrations or Supabase Studio).
-- Everyone can read it, nobody can write it through the public API.

create table public.cities (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_ka text not null,
  name_en text not null,
  sort smallint not null default 0
);

create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_ka text not null,
  name_en text not null,
  icon text not null default 'wrench',
  sort smallint not null default 0
);

alter table public.cities enable row level security;
alter table public.categories enable row level security;

create policy "cities are readable by everyone"
  on public.cities for select to anon, authenticated using (true);

create policy "categories are readable by everyone"
  on public.categories for select to anon, authenticated using (true);

insert into public.cities (slug, name_ka, name_en, sort) values
  ('tbilisi',     'თბილისი',     'Tbilisi',     1),
  ('batumi',      'ბათუმი',      'Batumi',      2),
  ('kutaisi',     'ქუთაისი',     'Kutaisi',     3),
  ('rustavi',     'რუსთავი',     'Rustavi',     4),
  ('zugdidi',     'ზუგდიდი',     'Zugdidi',     5),
  ('gori',        'გორი',        'Gori',        6),
  ('poti',        'ფოთი',        'Poti',        7),
  ('telavi',      'თელავი',      'Telavi',      8),
  ('kobuleti',    'ქობულეთი',    'Kobuleti',    9),
  ('mtskheta',    'მცხეთა',      'Mtskheta',    10),
  ('zestaponi',   'ზესტაფონი',   'Zestaponi',   11),
  ('samtredia',   'სამტრედია',   'Samtredia',   12),
  ('akhaltsikhe', 'ახალციხე',    'Akhaltsikhe', 13),
  ('marneuli',    'მარნეული',    'Marneuli',    14),
  ('ozurgeti',    'ოზურგეთი',    'Ozurgeti',    15);

insert into public.categories (slug, name_ka, name_en, icon, sort) values
  ('plumbing',           'სანტექნიკა',                 'Plumbing',            'droplets',        1),
  ('electrical',         'ელექტროობა',                 'Electrical',          'zap',             2),
  ('cleaning',           'დალაგება',                   'Cleaning',            'sparkles',        3),
  ('painting',           'შეღებვა',                    'Painting',            'paint-roller',    4),
  ('handyman',           'ხელოსანი',                   'Handyman',            'hammer',          5),
  ('carpentry',          'დურგლობა',                   'Carpentry',           'axe',             6),
  ('tiling',             'კაფელის დაგება',             'Tiling',              'grid-3x3',        7),
  ('plastering',         'მალიარობა / ბათქაში',        'Plastering',          'layers',          8),
  ('hvac',               'კონდიციონერი და გათბობა',    'AC & Heating',        'thermometer',     9),
  ('appliance-repair',   'ტექნიკის შეკეთება',          'Appliance repair',    'washing-machine', 10),
  ('locksmith',          'საკეტები',                   'Locksmith',           'key-round',       11),
  ('gardening',          'მებაღეობა',                  'Gardening',           'trees',           12),
  ('moving',             'გადაზიდვა',                  'Moving',              'truck',           13),
  ('roofing',            'სახურავი',                   'Roofing',             'house',           14),
  ('furniture-assembly', 'ავეჯის აწყობა',              'Furniture assembly',  'sofa',            15),
  ('windows-doors',      'კარ-ფანჯარა',                'Windows & doors',     'door-open',       16);
