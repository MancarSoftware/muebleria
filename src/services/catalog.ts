import { products as fallbackProducts } from '../data/products';
import { optimizeImageForUpload } from '../lib/imageUpload';
import { supabase } from '../lib/supabase';
import type { InventoryStatus, Product, ProductColorVariant, ProductStatus } from '../types/catalog';

type ProductImageRow = { id: string; storage_path: string; alt_text: string | null; sort_order: number };
type ProductVariantRow = { id: string; product_id: string; name: string; color_hex: string; image_storage_path: string | null; sort_order: number };
type ProductRow = { id: string; slug: string; name: string; category: string; price: number; description: string; materials: string[]; dimensions: string; colors: string[]; tags: string[]; featured: boolean; status: ProductStatus; inventory_status: InventoryStatus; lead_time_days: number | null; sort_order: number; ar_model_storage_path?: string | null; ar_ios_model_storage_path?: string | null; product_images?: ProductImageRow[] };
export type ProductDraft = Omit<Product, 'id' | 'images'> & { id?: string; images?: string[] };

const bucket = 'product-images';
const modelBucket = 'product-models';
const emptyImage = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85';

function mapVariant(row: ProductVariantRow): ProductColorVariant {
  const imageUrl = row.image_storage_path ? supabase?.storage.from(bucket).getPublicUrl(row.image_storage_path).data.publicUrl : undefined;
  return { id: row.id, name: row.name, hex: row.color_hex, imageUrl, imageStoragePath: row.image_storage_path, sortOrder: row.sort_order };
}

function mapProduct(row: ProductRow, variants: ProductColorVariant[] = []): Product {
  const images = (row.product_images ?? []).sort((a, b) => a.sort_order - b.sort_order).map((image) => supabase?.storage.from(bucket).getPublicUrl(image.storage_path).data.publicUrl).filter((url): url is string => Boolean(url));
  const arModelUrl = row.ar_model_storage_path ? supabase?.storage.from(modelBucket).getPublicUrl(row.ar_model_storage_path).data.publicUrl : undefined;
  const arIosModelUrl = row.ar_ios_model_storage_path ? supabase?.storage.from(modelBucket).getPublicUrl(row.ar_ios_model_storage_path).data.publicUrl : undefined;
  return { id: row.id, slug: row.slug, name: row.name, category: row.category, price: Number(row.price), description: row.description, materials: row.materials ?? [], dimensions: row.dimensions, colors: row.colors ?? [], variants, tags: row.tags ?? [], featured: row.featured, status: row.status, inventoryStatus: row.inventory_status, leadTimeDays: row.lead_time_days, sortOrder: row.sort_order, arModelUrl, arModelStoragePath: row.ar_model_storage_path, arIosModelUrl, arIosModelStoragePath: row.ar_ios_model_storage_path, images: images.length ? images : [emptyImage] };
}

async function variantsByProduct(productIds: string[]) {
  if (!supabase || productIds.length === 0) return new Map<string, ProductColorVariant[]>();
  const { data, error } = await supabase.from('product_color_variants').select('id, product_id, name, color_hex, image_storage_path, sort_order').in('product_id', productIds).order('sort_order');
  // Keeps the catalog available while an existing test project is waiting for the incremental migration.
  if (error?.code === '42P01') return new Map<string, ProductColorVariant[]>();
  if (error) throw error;
  return (data as ProductVariantRow[]).reduce((result, row) => {
    result.set(row.product_id, [...(result.get(row.product_id) ?? []), mapVariant(row)]);
    return result;
  }, new Map<string, ProductColorVariant[]>());
}

async function mapProducts(rows: ProductRow[]) {
  const variants = await variantsByProduct(rows.map((row) => row.id));
  return rows.map((row) => mapProduct(row, variants.get(row.id) ?? []));
}

export async function getPublishedProducts(): Promise<Product[]> {
  if (!supabase) return fallbackProducts;
  const { data, error } = await supabase.from('products').select('*, product_images(id, storage_path, alt_text, sort_order)').eq('status', 'published').order('sort_order').order('created_at', { ascending: false });
  if (error) throw error;
  return mapProducts(data as ProductRow[]);
}

export async function getAdminProducts(): Promise<Product[]> {
  if (!supabase) return fallbackProducts;
  const { data, error } = await supabase.from('products').select('*, product_images(id, storage_path, alt_text, sort_order)').order('sort_order').order('created_at', { ascending: false });
  if (error) throw error;
  return mapProducts(data as ProductRow[]);
}

const toPayload = (product: ProductDraft) => ({
  slug: product.slug.trim(), name: product.name.trim(), category: product.category, price: Number(product.price), description: product.description.trim(), materials: product.materials.map((value) => value.trim()).filter(Boolean), dimensions: product.dimensions.trim(), colors: product.colors.map((value) => value.trim()).filter(Boolean), tags: product.tags.map((value) => value.trim()).filter(Boolean), featured: product.featured, status: product.status ?? 'draft', inventory_status: product.inventoryStatus ?? 'made_to_order', lead_time_days: product.leadTimeDays ?? null, sort_order: product.sortOrder ?? 0,
  ...(product.arModelStoragePath !== undefined || product.arIosModelStoragePath !== undefined ? {
    ar_model_storage_path: product.arModelStoragePath ?? null,
    ar_ios_model_storage_path: product.arIosModelStoragePath ?? null,
  } : {}),
});

export async function saveProduct(product: ProductDraft): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const payload = toPayload(product);
  const query = product.id ? supabase.from('products').update(payload).eq('id', product.id).select('id').single() : supabase.from('products').insert(payload).select('id').single();
  const { data, error } = await query;
  if (error) throw error;
  return data.id;
}

export async function uploadProductImages(productId: string, files: File[]) {
  if (!supabase || files.length === 0) return;
  const paths: string[] = [];
  for (const [index, file] of files.entries()) {
    const optimizedFile = await optimizeImageForUpload(file);
    const extension = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp';
    const path = `${productId}/${crypto.randomUUID()}-${index}.${extension}`;
    const { error } = await supabase.storage.from(bucket).upload(path, optimizedFile, { cacheControl: '31536000', contentType: optimizedFile.type, upsert: false });
    if (error) throw error;
    paths.push(path);
  }
  const { data: currentImages, error: currentImagesError } = await supabase.from('product_images').select('sort_order').eq('product_id', productId).order('sort_order', { ascending: false }).limit(1);
  if (currentImagesError) throw currentImagesError;
  const startingOrder = (currentImages[0]?.sort_order ?? -1) + 1;
  const { error } = await supabase.from('product_images').insert(paths.map((storage_path, index) => ({ product_id: productId, storage_path, sort_order: startingOrder + index })));
  if (error) throw error;
}

export type ArModelPlatform = 'android' | 'ios';

const modelFileDetails: Record<ArModelPlatform, { extension: string; column: 'ar_model_storage_path' | 'ar_ios_model_storage_path'; label: string }> = {
  android: { extension: 'glb', column: 'ar_model_storage_path', label: 'GLB para Android' },
  ios: { extension: 'usdz', column: 'ar_ios_model_storage_path', label: 'USDZ para iPhone' },
};

function modelUploadError(platform: ArModelPlatform, file: File) {
  const details = modelFileDetails[platform];
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== details.extension) throw new Error(`Selecciona un archivo .${details.extension.toUpperCase()} para ${details.label}.`);
  if (file.size > 52_428_800) throw new Error('El modelo 3D supera el límite de 50 MB. Optimízalo antes de subirlo.');
}

export async function uploadProductArModel(productId: string, platform: ArModelPlatform, file: File, previousPath?: string | null) {
  if (!supabase) throw new Error('Supabase is not configured.');
  modelUploadError(platform, file);
  const details = modelFileDetails[platform];
  const path = `${productId}/${platform}-${crypto.randomUUID()}.${details.extension}`;
  const { error: uploadError } = await supabase.storage.from(modelBucket).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase.from('products').update({ [details.column]: path }).eq('id', productId);
  if (updateError) {
    await supabase.storage.from(modelBucket).remove([path]);
    throw updateError;
  }
  if (previousPath) await supabase.storage.from(modelBucket).remove([previousPath]);
  return { storagePath: path, url: supabase.storage.from(modelBucket).getPublicUrl(path).data.publicUrl };
}

export async function removeProductArModel(productId: string, platform: ArModelPlatform, storagePath?: string | null) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const details = modelFileDetails[platform];
  const { error } = await supabase.from('products').update({ [details.column]: null }).eq('id', productId);
  if (error) throw error;
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(modelBucket).remove([storagePath]);
    if (storageError) throw storageError;
  }
}

export async function saveProductVariants(productId: string, variants: ProductColorVariant[]) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const nextVariants = variants.filter((variant) => variant.name.trim()).map((variant, index) => ({
    ...variant,
    name: variant.name.trim(),
    hex: variant.hex.toUpperCase(),
    sortOrder: index,
  }));
  const { data: currentRows, error: currentError } = await supabase.from('product_color_variants').select('id, image_storage_path').eq('product_id', productId);
  if (currentError) throw currentError;

  const current = currentRows as Array<{ id: string; image_storage_path: string | null }>;
  const nextIds = new Set(nextVariants.map((variant) => variant.id));
  const removed = current.filter((variant) => !nextIds.has(variant.id));

  if (nextVariants.length) {
    const { error } = await supabase.from('product_color_variants').upsert(nextVariants.map((variant) => ({
      id: variant.id,
      product_id: productId,
      name: variant.name,
      color_hex: variant.hex,
      image_storage_path: variant.imageStoragePath ?? null,
      sort_order: variant.sortOrder,
    })));
    if (error) throw error;
  }

  if (removed.length) {
    const { error } = await supabase.from('product_color_variants').delete().in('id', removed.map((variant) => variant.id));
    if (error) throw error;
    const paths = removed.flatMap((variant) => variant.image_storage_path ? [variant.image_storage_path] : []);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }
}

export async function uploadProductVariantImage(productId: string, variant: ProductColorVariant, file: File): Promise<ProductColorVariant> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const optimizedFile = await optimizeImageForUpload(file);
  const extension = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp';
  const storagePath = `${productId}/variants/${variant.id}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(storagePath, optimizedFile, { cacheControl: '31536000', contentType: optimizedFile.type, upsert: false });
  if (error) throw error;
  if (variant.imageStoragePath) await supabase.storage.from(bucket).remove([variant.imageStoragePath]);
  const imageUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
  return { ...variant, imageStoragePath: storagePath, imageUrl };
}

export async function removeProductImage(productId: string, imageUrl: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('product_images').select('id, storage_path').eq('product_id', productId);
  if (error) throw error;
  const image = (data as Array<{ id: string; storage_path: string }>).find((item) => imageUrl.endsWith(`/product-images/${item.storage_path}`));
  if (!image) return;
  const { error: storageError } = await supabase.storage.from(bucket).remove([image.storage_path]);
  if (storageError) throw storageError;
  const { error: imageError } = await supabase.from('product_images').delete().eq('id', image.id);
  if (imageError) throw imageError;
}

export async function deleteProduct(productId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: images, error: imagesError } = await supabase.from('product_images').select('storage_path').eq('product_id', productId);
  if (imagesError) throw imagesError;
  const paths = (images as Array<{ storage_path: string }>).map(({ storage_path }) => storage_path);
  if (paths.length) { const { error } = await supabase.storage.from(bucket).remove(paths); if (error) throw error; }
  const { data: modelRow, error: modelError } = await supabase.from('products').select('ar_model_storage_path, ar_ios_model_storage_path').eq('id', productId).maybeSingle();
  if (modelError && modelError.code !== '42703') throw modelError;
  const modelPaths = modelError ? [] : [
    (modelRow as { ar_model_storage_path?: string | null; ar_ios_model_storage_path?: string | null } | null)?.ar_model_storage_path,
    (modelRow as { ar_model_storage_path?: string | null; ar_ios_model_storage_path?: string | null } | null)?.ar_ios_model_storage_path,
  ].filter((path): path is string => Boolean(path));
  if (modelPaths.length) { const { error } = await supabase.storage.from(modelBucket).remove(modelPaths); if (error) throw error; }
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

async function imageFileFromUrl(imageUrl: string, productSlug: string, index: number): Promise<File> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Could not download the demo image for ${productSlug}.`);
  const image = await response.blob();
  const extension = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg';
  return new File([image], `${productSlug}-${index + 1}.${extension}`, { type: image.type || 'image/jpeg' });
}

export async function seedDemoCatalog(): Promise<{ created: number; skipped: number; imagesWithFallback: number }> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.from('products').select('slug');
  if (error) throw error;

  const existingSlugs = new Set((data as Array<{ slug: string }>).map((product) => product.slug));
  let created = 0;
  let skipped = 0;
  let imagesWithFallback = 0;

  for (const [index, demoProduct] of fallbackProducts.entries()) {
    if (existingSlugs.has(demoProduct.slug)) {
      skipped += 1;
      continue;
    }

    const id = await saveProduct({
      ...demoProduct,
      id: undefined,
      images: undefined,
      status: 'published',
      inventoryStatus: 'in_stock',
      leadTimeDays: 14,
      sortOrder: index,
    });

    try {
      const imageFiles = await Promise.all(demoProduct.images.map((imageUrl, imageIndex) => imageFileFromUrl(imageUrl, demoProduct.slug, imageIndex)));
      await uploadProductImages(id, imageFiles);
    } catch {
      imagesWithFallback += 1;
    }

    created += 1;
  }

  return { created, skipped, imagesWithFallback };
}
