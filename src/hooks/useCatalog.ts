import { useEffect, useState } from 'react';
import { products as fallbackProducts } from '../data/products';
import { isSupabaseConfigured } from '../lib/supabase';
import { getPublishedProducts } from '../services/catalog';
import type { Product } from '../types/catalog';

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getPublishedProducts().then((next) => { if (active) setProducts(next); }).catch(() => undefined).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  return { products, isLoading };
}
