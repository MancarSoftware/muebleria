import { ArrowUpRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSpacePlanner } from '../hooks/useSpacePlanner';
import { trackEvent } from '../lib/analytics';
import type { Product } from '../types/catalog';

export function ProductCard({ product }: { product: Product }) {
  const planner = useSpacePlanner();
  const saved = planner.has(product.id);
  const toggle = () => { if (saved) { planner.remove(product.id); trackEvent('remove_from_space', { item_id: product.id, item_name: product.name, item_category: product.category }); } else { planner.add(product.id); trackEvent('add_to_space', { item_id: product.id, item_name: product.name, item_category: product.category, value: product.price, currency: 'USD' }); } };
  return <article className="product-card">
    <Link to={`/catalog/${product.slug}`}><img src={product.images[0]} alt={product.name} loading="lazy" decoding="async" sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw"/><span>{product.category}</span><h3>{product.name}</h3><b>${product.price.toLocaleString('en-US')}</b><ArrowUpRight className="corner"/></Link>
    <button className={saved ? 'fav active' : 'fav'} onClick={toggle} aria-label={`${saved ? 'Quitar' : 'Añadir'} ${product.name} ${saved ? 'de' : 'a'} mi espacio`}><Heart fill={saved ? 'currentColor' : 'none'}/></button>
  </article>;
}
