import { products as fallbackProducts } from '../data/products';
import { supabase } from '../lib/supabase';
import type { InventoryStatus, Product, ProductStatus } from '../types/catalog';

type ProductImageRow = { id: string; storage_path: string; alt_text: string | null; sort_order: number };
type ProductRow = { id: string; slug: string; name: string; category: string; price: number; description: string; materials: string[]; dimensions: string; colors: string[]; tags: string[]; featured: boolean; status: ProductStatus; inventory_status: InventoryStatus; lead_time_days: number | null; sort_order: number; product_images?: ProductImageRow[] };
export type ProductDraft = Omit<Product, 'id' | 'images'> & { id?: string; images?: string[] };

const bucket = 'product-images';
const emptyImage = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85';

function mapProduct(row: ProductRow): Product {
  const images = (row.product_images ?? []).sort((a, b) => a.sort_order - b.sort_order).map((image) => supabase?.storage.from(bucket).getPublicUrl(image.storage_path).data.publicUrl).filter((url): url is string => Boolean(url));
  return { id: row.id, slug: row.slug, name: row.name, category: row.category, price: Number(row.price), description: row.description, materials: row.materials ?? [], dimensions: row.dimensions, colors: row.colors ?? [], tags: row.tags ?? [], featured: row.featured, status: row.status, inventoryStatus: row.inventory_status, leadTimeDays: row.lead_time_days, sortOrder: row.sort_order, images: images.length ? images : [emptyImage] };
}

export async function getPublishedProducts(): Promise<Product[]> {
  if (!supabase) return fallbackProducts;
  const { data, error } = await supabase.from('products').select('*, product_images(id, storage_path, alt_text, sort_order)').eq('status', 'published').order('sort_order').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

export async function getAdminProducts(): Promise<Product[]> {
  if (!supabase) return fallbackProducts;
  const { data, error } = await supabase.from('products').select('*, product_images(id, storage_path, alt_text, sort_order)').order('sort_order').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductRow[]).map(mapProduct);
}

const toPayload = (product: ProductDraft) => ({ slug: product.slug.trim(), name: product.name.trim(), category: product.category, price: Number(product.price), description: product.description.trim(), materials: product.materials.map((value) => value.trim()).filter(Boolean), dimensions: product.dimensions.trim(), colors: product.colors.map((value) => value.trim()).filter(Boolean), tags: product.tags.map((value) => value.trim()).filter(Boolean), featured: product.featured, status: product.status ?? 'draft', inventory_status: product.inventoryStatus ?? 'made_to_order', lead_time_days: product.leadTimeDays ?? null, sort_order: product.sortOrder ?? 0 });

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
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${productId}/${crypto.randomUUID()}-${index}.${extension}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '31536000', contentType: file.type, upsert: false });
    if (error) throw error;
    paths.push(path);
  }
  const { data: currentImages, error: currentImagesError } = await supabase.from('product_images').select('sort_order').eq('product_id', productId).order('sort_order', { ascending: false }).limit(1);
  if (currentImagesError) throw currentImagesError;
  const startingOrder = (currentImages[0]?.sort_order ?? -1) + 1;
  const { error } = await supabase.from('product_images').insert(paths.map((storage_path, index) => ({ product_id: productId, storage_path, sort_order: startingOrder + index })));
  if (error) throw error;
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
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}
