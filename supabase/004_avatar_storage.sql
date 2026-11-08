-- Supabase Storage bucket: gallery photos become PUBLIC leaderboard images.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('player-avatars','player-avatars',true,2097152,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists rsc_avatar_insert on storage.objects;
create policy rsc_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='player-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists rsc_avatar_update on storage.objects;
create policy rsc_avatar_update on storage.objects for update to authenticated using(bucket_id='player-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='player-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists rsc_avatar_own_read on storage.objects;
create policy rsc_avatar_own_read on storage.objects for select to authenticated using(bucket_id='player-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists rsc_avatar_delete on storage.objects;
create policy rsc_avatar_delete on storage.objects for delete to authenticated using(bucket_id='player-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
