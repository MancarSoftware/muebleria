import { ArrowLeft, Check, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CatalogAdvisor } from '../components/CatalogAdvisor';
import { ProductCard } from '../components/ProductCard';
import { whatsappLink } from '../config/business';
import { useCatalog } from '../hooks/useCatalog';
import { productColorVariants } from '../lib/colorVariants';
import { useFavorites } from '../hooks/useFavorites';

export function ProductDetail() {
  const { slug } = useParams();
  const { ids, toggle } = useFavorites();
  const { products, isLoading } = useCatalog();
  const product = products.find((item) => item.slug === slug);
  const variants = useMemo(() => product ? productColorVariants(product) : [], [product]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>();

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id);
  }, [product?.id]);

  if (!product && isLoading) return <section className="empty"><p className="eyebrow">CATÁLOGO</p><h2>Buscando la pieza…</h2></section>;
  if (!product) return <section className="empty"><h1>Esta pieza ya no está disponible.</h1><Link to="/catalog">Volver al catálogo</Link></section>;

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const galleryImages = [selectedVariant?.imageUrl, ...product.images].filter((image, index, images): image is string => Boolean(image) && images.indexOf(image) === index);
  const saved = ids.includes(product.id);
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).concat(products.filter((item) => item.id !== product.id)).slice(0, 3);
  const selectedColorName = selectedVariant?.name ?? 'por confirmar';

  return <section className="detail">
    <Link className="back" to="/catalog"><ArrowLeft/> Catálogo</Link>
    <div className="detail-top">
      <div className="gallery"><img src={galleryImages[0] ?? product.images[0]} alt={`${product.name}${selectedVariant ? ` en ${selectedVariant.name}` : ''}`}/>{selectedVariant && <p className="gallery-caption">{selectedVariant.imageUrl ? `Vista de ${selectedVariant.name}` : 'Foto referencial · el tono seleccionado puede variar según la pantalla.'}</p>}</div>
      <div className="detail-copy">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="price">${product.price.toLocaleString('en-US')}</p>
        <p>{product.description}</p>
        <dl>
          <div><dt>Materiales</dt><dd>{product.materials.join(' · ')}</dd></div>
          <div><dt>Dimensiones</dt><dd>{product.dimensions}</dd></div>
          <div className="color-detail"><dt>Colores</dt><dd>{variants.length ? <><div className="color-picker" role="radiogroup" aria-label="Selecciona un color">{variants.map((variant) => <button type="button" key={variant.id} className={variant.id === selectedVariant?.id ? 'selected' : ''} aria-checked={variant.id === selectedVariant?.id} role="radio" onClick={() => setSelectedVariantId(variant.id)} title={variant.name}><i style={{ backgroundColor: variant.hex }}/><span className="sr-only">{variant.name}</span></button>)}</div><p className="selected-color" aria-live="polite"><b>{selectedColorName}</b><span>{selectedVariant?.imageUrl ? 'La fotografía muestra esta variante.' : 'Foto referencial'}</span></p></> : 'Consulta disponibilidad'}</dd></div>
        </dl>
        <CatalogAdvisor context={product} products={products}/>
        <a className="dark-button full" href={whatsappLink(`Hola, me interesa ${product.name} en color ${selectedColorName}. La vi en el sitio web y quisiera más información.`)} target="_blank" rel="noreferrer">Consultar por WhatsApp</a>
        <button className="save" onClick={() => toggle(product.id)}><Heart fill={saved ? 'currentColor' : 'none'}/> {saved ? 'Guardado en favoritos' : 'Guardar en favoritos'}</button>
        <ul>{['Materiales seleccionados para durar', 'Entrega coordinada y atención personal', 'Asesoría para tu espacio'].map((item) => <li key={item}><Check/>{item}</li>)}</ul>
      </div>
    </div>
    <div className="section-head"><h2>También puede gustarte</h2></div>
    <div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item}/>)}</div>
  </section>;
}
