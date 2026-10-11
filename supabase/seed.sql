-- Local demo data only (applied by `supabase db reset` / `supabase start`). Never run against production.
-- Every demo worker can log in with password "password123".
-- Demo images point at external placeholder services; real uploads live in Supabase Storage.

do $$
declare
  w record;
  uid uuid;
  i int;
begin
  for w in
    select * from (values
      (1,  'giorgi.beridze@example.com',   'გიორგი ბერიძე',     'Giorgi Beridze',     'სანტექნიკოსი 12 წლიანი გამოცდილებით',       12, '+995555101010', array['plumbing','hvac'],                 array['tbilisi','rustavi','mtskheta'], 40),
      (2,  'nino.kapanadze@example.com',   'ნინო კაპანაძე',     'Nino Kapanadze',     'სახლისა და ოფისის პროფესიონალური დალაგება', 6,  '+995555202020', array['cleaning'],                         array['tbilisi'],                      60),
      (3,  'levan.gelashvili@example.com', 'ლევან გელაშვილი',   'Levan Gelashvili',   'ელექტრიკოსი — გაყვანილობა, ფარები, განათება', 15, '+995555303030', array['electrical'],                       array['tbilisi','gori'],               50),
      (4,  'tamar.jgerenaia@example.com',  'თამარ ჯღერენაია',   'Tamar Jgerenaia',    'ინტერიერის შეღებვა და დეკორატიული მალიარობა', 8,  '+995555404040', array['painting','plastering'],           array['batumi','kobuleti'],            15),
      (5,  'davit.lomidze@example.com',    'დავით ლომიძე',      'Davit Lomidze',      'ხელოსანი ყველა საოჯახო საქმისთვის',         10, '+995555505050', array['handyman','furniture-assembly'],   array['kutaisi','zestaponi','samtredia'], 30),
      (6,  'irakli.tsiklauri@example.com', 'ირაკლი წიკლაური',   'Irakli Tsiklauri',   'კაფელის დაგება და აბაზანის რემონტი',         9,  '+995555606060', array['tiling','plumbing'],              array['tbilisi','rustavi'],            35),
      (7,  'mariam.abashidze@example.com', 'მარიამ აბაშიძე',    'Mariam Abashidze',   'ბაღის მოვლა და ლანდშაფტური დიზაინი',         5,  '+995555707070', array['gardening'],                       array['batumi','ozurgeti'],            45),
      (8,  'zura.kvaratskhelia@example.com','ზურა კვარაცხელია', 'Zura Kvaratskhelia', 'კონდიციონერების მონტაჟი და სერვისი',         7,  '+995555808080', array['hvac','appliance-repair'],         array['tbilisi','mtskheta','telavi'],  80),
      (9,  'sandro.mchedlishvili@example.com','სანდრო მჭედლიშვილი','Sandro Mchedlishvili','ხის ავეჯი შეკვეთით და დურგლობა',         20, '+995555909090', array['carpentry','furniture-assembly'],  array['telavi','tbilisi'],             25),
      (10, 'ana.chikovani@example.com',    'ანა ჩიქოვანი',      'Ana Chikovani',      'გადაზიდვა და ტვირთის გადატანა ქალაქში',      4,  '+995555111222', array['moving'],                          array['tbilisi','rustavi','marneuli'], 70),
      (11, 'beka.tsereteli@example.com',   'ბექა წერეთელი',     'Beka Tsereteli',     'საკეტების გაღება და შეცვლა 24/7',            11, '+995555333444', array['locksmith','windows-doors'],       array['kutaisi','poti','zugdidi'],     55),
      (12, 'eka.nozadze@example.com',      'ეკა ნოზაძე',        'Eka Nozadze',        'სახურავის შეკეთება და ჰიდროიზოლაცია',        14, '+995555555666', array['roofing','handyman'],              array['akhaltsikhe','gori','zestaponi'], 65)
    ) as t(n, email, name_ka, name_en, headline, years, phone, cats, cities, avatar_img)
  loop
    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', w.email,
      extensions.crypt('password123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', w.name_ka),
      now() - (w.n || ' days')::interval, now(), '', '', '', ''
    );

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (uid::text, uid, jsonb_build_object('sub', uid::text, 'email', w.email, 'email_verified', true), 'email', now(), now(), now());

    insert into public.worker_cities (worker_id, city_id)
    select uid, id from public.cities where slug = any (w.cities);

    insert into public.worker_categories (worker_id, category_id)
    select uid, id from public.categories where slug = any (w.cats);

    insert into public.worker_services (worker_id, category_id, title, description, price_from, price_to, price_unit, sort)
    select uid, c.id,
           c.name_ka || ' — კონსულტაცია და შეფასება',
           'ადგილზე მისვლა, პრობლემის შეფასება და სამუშაოს გეგმა.',
           20 + w.n * 2, null, 'fixed', 0
    from public.categories c where c.slug = w.cats[1];

    insert into public.worker_services (worker_id, category_id, title, description, price_from, price_to, price_unit, sort)
    select uid, c.id,
           c.name_ka || ' — სამუშაო საათობრივად',
           'მასალის ღირებულება არ შედის ფასში.',
           25 + w.n * 3, 40 + w.n * 4, 'hour', 1
    from public.categories c where c.slug = w.cats[1];

    insert into public.worker_services (worker_id, title, description, price_from, price_unit, sort)
    values (uid, 'დიდი პროექტები', 'ფასი შეთანხმებით, სამუშაოს მოცულობის მიხედვით.', null, 'negotiable', 2);

    for i in 1..(3 + w.n % 4) loop
      insert into public.portfolio_images (worker_id, path, thumb_path, caption, sort)
      values (
        uid,
        'https://picsum.photos/seed/worker' || w.n || '-' || i || '/1600/1200',
        'https://picsum.photos/seed/worker' || w.n || '-' || i || '/480/360',
        'პროექტი #' || i,
        i
      );
    end loop;

    update public.worker_profiles set
      slug = lower(replace(w.name_en, ' ', '-')),
      full_name = w.name_ka,
      headline = w.headline,
      bio = 'გამარჯობა! მე ვარ ' || w.name_ka || '. ' || w.years || ' წელია ვმუშაობ ამ სფეროში. '
            || 'ვმუშაობ სწრაფად, სუფთად და გარანტიით. დამიკავშირდით ზარით ან WhatsApp-ით — '
            || 'სიამოვნებით გიპასუხებთ ყველა კითხვაზე და შეგითანხმებთ მოსახერხებელ დროს.',
      avatar_path = 'https://i.pravatar.cc/400?img=' || w.avatar_img % 70,
      years_experience = w.years,
      phone = w.phone,
      whatsapp = w.phone,
      viber = case when w.n % 2 = 0 then w.phone end,
      telegram = case when w.n % 3 = 0 then 'demo_worker_' || w.n end,
      contact_email = w.email,
      is_published = true
    where id = uid;
  end loop;
end;
$$;
