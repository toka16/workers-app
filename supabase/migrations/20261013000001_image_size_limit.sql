-- Images are resized in the browser before upload, so 2 MB is plenty; keep the buckets in line with
-- MAX_IMAGE_BYTES in src/domain/models.ts. Existing objects are unaffected.
update storage.buckets
set file_size_limit = 2097152
where id in ('avatars', 'portfolio');
