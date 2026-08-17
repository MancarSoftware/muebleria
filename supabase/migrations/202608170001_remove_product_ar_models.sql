-- Retires the discontinued product AR feature from the database.
-- Safe to run whether or not the earlier AR migration was applied.
--
-- Storage files and buckets must be removed through the Supabase Storage API or
-- Dashboard. They are intentionally not deleted here: direct SQL deletion would
-- leave orphaned files in the underlying object store.

drop policy if exists "Managers can upload product models" on storage.objects;
drop policy if exists "Managers can update product models" on storage.objects;
drop policy if exists "Managers can delete product models" on storage.objects;

alter table public.products
  drop column if exists ar_model_storage_path,
  drop column if exists ar_ios_model_storage_path;
