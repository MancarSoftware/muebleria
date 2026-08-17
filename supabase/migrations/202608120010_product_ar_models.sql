-- Adds production-ready 3D model storage for mobile AR.
-- Android/WebXR uses GLB; iOS Quick Look uses USDZ.

alter table public.products
  add column if not exists ar_model_storage_path text,
  add column if not exists ar_ios_model_storage_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-models',
  'product-models',
  true,
  52428800,
  array[
    'model/gltf-binary',
    'model/gltf+json',
    'model/vnd.usdz+zip',
    'model/usdz+zip',
    'application/octet-stream'
  ]
)
on conflict (id) do update
  set public = true,
      file_size_limit = 52428800,
      allowed_mime_types = array[
        'model/gltf-binary',
        'model/gltf+json',
        'model/vnd.usdz+zip',
        'model/usdz+zip',
        'application/octet-stream'
      ];

create policy "Managers can upload product models"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-models' and public.is_catalog_manager());

create policy "Managers can update product models"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-models' and public.is_catalog_manager());

create policy "Managers can delete product models"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-models' and public.is_catalog_manager());
