-- =============================================================
-- 0007 Storage buckets (private only) + per-store policies.
-- Path convention: {store_id}/{owner_id}/{uuid}.{ext}
-- =============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('announcements','announcements',false,5242880,array['image/jpeg','image/png','image/webp']),
  ('manuals','manuals',false,20971520,array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- announcements
create policy ann_select_same_store on storage.objects for select to authenticated
  using (bucket_id = 'announcements'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id());
create policy ann_insert_manager on storage.objects for insert to authenticated
  with check (bucket_id = 'announcements'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id()
    and (storage.foldername(name))[2]::uuid = auth.uid()
    and public.jwt_role() = 'manager');
create policy ann_update_manager on storage.objects for update to authenticated
  using (bucket_id = 'announcements'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id()
    and public.jwt_role() = 'manager')
  with check (bucket_id = 'announcements'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id()
    and public.jwt_role() = 'manager');
create policy ann_delete_manager on storage.objects for delete to authenticated
  using (bucket_id = 'announcements'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id()
    and public.jwt_role() = 'manager');

-- manuals
create policy man_select_same_store on storage.objects for select to authenticated
  using (bucket_id = 'manuals'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id());
create policy man_insert_manager on storage.objects for insert to authenticated
  with check (bucket_id = 'manuals'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id()
    and (storage.foldername(name))[2]::uuid = auth.uid()
    and public.jwt_role() = 'manager');
create policy man_update_manager on storage.objects for update to authenticated
  using (bucket_id = 'manuals'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id()
    and public.jwt_role() = 'manager')
  with check (bucket_id = 'manuals'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id()
    and public.jwt_role() = 'manager');
create policy man_delete_manager on storage.objects for delete to authenticated
  using (bucket_id = 'manuals'
    and (storage.foldername(name))[1]::uuid = public.jwt_store_id()
    and public.jwt_role() = 'manager');
