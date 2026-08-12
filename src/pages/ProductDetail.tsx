import { ArrowLeft, Check, Heart } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { CatalogAdvisor } from '../components/CatalogAdvisor';
import { ProductCard } from '../components/ProductCard';
import { whatsappLink } from '../config/business';
import { useCatalog } from '../hooks/useCatalog';
import { useFavorites } from '../hooks/useFavorites';

export function ProductDetail() {
  const { slug } = useParams();
  const { ids, toggle } = useFavorites();
  const { products, isLoading } = useCatalog();
  const product = products.find((item) => item.slug === slug);
  if (!product && isLoading) return <section className="empty"><p className="eyebrow">CATÁLOGO</p><h2>Buscando la pieza…</h2></section>;
  if (!product) return <section className="empty"><h1>Esta pieza ya no está disponible.</h1><Link to="/catalog">Volver al catálogo</Link></section>;
  const saved = ids.includes(product.id);
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).concat(products.filter((item) => item.id !== product.id)).slice(0, 3);
  return <section className="detail"><Link className="back" to="/catalog"><ArrowLeft/> Catálogo</Link><div className="detail-top"><div className="gallery"><img src={product.images[0]} alt={product.name}/></div><div className="detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="price">${product.price.toLocaleString('en-US')}</p><p>{product.description}</p><dl><div><dt>Materiales</dt><dd>{product.materials.join(' · ')}</dd></div><div><dt>Dimensiones</dt><dd>{product.dimensions}</dd></div><div><dt>Colores</dt><dd>{product.colors.map((color) => <i className="swatch" key={color}/>)}</dd></div></dl><CatalogAdvisor context={product} products={products}/><a className="dark-button full" href={whatsappLink(`Hola, me interesa ${product.name}. La vi en el sitio web y quisiera más información.`)} target="_blank" rel="noreferrer">Consultar por WhatsApp</a><button className="save" onClick={() => toggle(product.id)}><Heart fill={saved ? 'currentColor' : 'none'}/> {saved ? 'Guardado en favoritos' : 'Guardar en favoritos'}</button><ul>{['Materiales seleccionados para durar', 'Entrega coordinada y atención personal', 'Asesoría para tu espacio'].map((item) => <li key={item}><Check/>{item}</li>)}</ul></div></div><div className="section-head"><h2>También puede gustarte</h2></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item}/>)}</div></section>;
}
