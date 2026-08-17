-- Retires the discontinued product AR feature and all of its dedicated storage.
-- Safe to run whether or not the earlier AR migration was applied.

drop policy if exists "Managers can upload product models" on storage.objects;
drop policy if exists "Managers can update product models" on storage.objects;
drop policy if exists "Managers can delete product models" on storage.objects;

delete from storage.objects where bucket_id = 'product-models';
delete from storage.buckets where id = 'product-models';

alter table public.products
  drop column if exists ar_model_storage_path,
  drop column if exists ar_ios_model_storage_path;
