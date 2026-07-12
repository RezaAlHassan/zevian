-- Profile pictures for employees.
--
-- The employees.avatar_url column already exists (mapped in dbEmployeeToEmployee and selected in
-- report queries); ADD COLUMN IF NOT EXISTS is kept only so a fresh/prod DB stays in parity.
alter table employees add column if not exists avatar_url text;

-- ── Storage bucket ──────────────────────────────────────────────────────────
-- Public bucket so a plain <img src> renders without minting signed URLs. Small images only
-- (2 MB cap), common web image types. Idempotent: re-running updates the limits.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/jpg','image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── RLS policies on storage.objects ─────────────────────────────────────────
-- Read: anyone (public bucket). Write/update/delete: only the authenticated user, and only inside
-- their own top-level folder {auth.uid()}/…  — so no one can overwrite another user's avatar.
-- Files are uploaded to  avatars/{auth.uid()}/avatar-<ts>.<ext>  (see AccountView upload).
drop policy if exists "avatars_public_read"  on storage.objects;
drop policy if exists "avatars_user_insert"  on storage.objects;
drop policy if exists "avatars_user_update"  on storage.objects;
drop policy if exists "avatars_user_delete"  on storage.objects;

create policy "avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "avatars_user_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_user_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_user_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
