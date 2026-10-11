-- Public image buckets. Objects are stored under "<user id>/<file>", and only that user may write there.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',   'avatars',   true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio', 'portfolio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL without any policy; listing objects is limited to the owner.
create policy "workers list their own files"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('avatars', 'portfolio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "workers upload into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'portfolio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "workers update their own files"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'portfolio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'portfolio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "workers delete their own files"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'portfolio')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
