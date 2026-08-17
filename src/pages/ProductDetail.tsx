import { ArrowLeft, Check, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CatalogAdvisor } from '../components/CatalogAdvisor';
import { ProductCard } from '../components/ProductCard';
import { whatsappLink } from '../config/business';
import { useCatalog } from '../hooks/useCatalog';
import { productColorVariants } from '../lib/colorVariants';
import { roomForProductCategory, useSpacePlanner } from '../hooks/useSpacePlanner';
import { trackEvent } from '../lib/analytics';

export function ProductDetail() {
  const { slug } = useParams();
  const planner = useSpacePlanner();
  const { products, isLoading } = useCatalog();
  const product = products.find((item) => item.slug === slug);
  const variants = useMemo(() => product ? productColorVariants(product) : [], [product]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>();
  const [activeImageUrl, setActiveImageUrl] = useState<string>();

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id);
  }, [product?.id]);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const galleryImages = useMemo(() => product ? [selectedVariant?.imageUrl, ...product.images].filter((image, index, images): image is string => Boolean(image) && images.indexOf(image) === index) : [], [product, selectedVariant?.imageUrl]);
  const hasImageCarousel = Boolean(product && product.images.length > 2);

  useEffect(() => {
    if (product) setActiveImageUrl(selectedVariant?.imageUrl ?? product.images[0]);
  }, [product?.id, selectedVariant?.id, selectedVariant?.imageUrl]);

  useEffect(() => {
    if (!hasImageCarousel || galleryImages.length < 2) return;
    const timer = window.setTimeout(() => {
      setActiveImageUrl((currentImage) => {
        const currentIndex = galleryImages.indexOf(currentImage ?? galleryImages[0]);
        return galleryImages[(currentIndex + 1) % galleryImages.length];
      });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [activeImageUrl, galleryImages, hasImageCarousel]);

  useEffect(() => {
    if (product) trackEvent('view_item', { currency: 'USD', value: product.price, item_id: product.id, item_name: product.name, item_category: product.category });
  }, [product?.id]);

  if (!product && isLoading) return <section className="empty"><p className="eyebrow">CATÁLOGO</p><h2>Buscando la pieza…</h2></section>;
  if (!product) return <section className="empty"><h1>Esta pieza ya no está disponible.</h1><Link to="/catalog">Volver al catálogo</Link></section>;

  const mainImage = activeImageUrl && galleryImages.includes(activeImageUrl) ? activeImageUrl : galleryImages[0] ?? product.images[0];
  const inSpace = planner.has(product.id);
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).concat(products.filter((item) => item.id !== product.id)).slice(0, 3);
  const selectedColorName = selectedVariant?.name ?? 'por confirmar';

  return <section className="detail">
    <Link className="back" to="/catalog"><ArrowLeft/> Catálogo</Link>
    <div className="detail-top">
      <div className="gallery">
        <img src={mainImage} alt={`${product.name}${selectedVariant ? ` en ${selectedVariant.name}` : ''}`} decoding="async" fetchPriority="high" sizes="(max-width: 900px) 100vw, 55vw"/>
        {hasImageCarousel && <div className="gallery-thumbnails" aria-label="Más fotografías del producto">{product.images.map((image, index) => <button type="button" key={image} className={image === mainImage ? 'selected' : ''} onClick={() => setActiveImageUrl(image)} aria-label={`Ver fotografía ${index + 1} de ${product.name}`}><img src={image} alt="" loading="lazy" decoding="async"/></button>)}</div>}
      </div>
      <div className="detail-copy">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="price">${product.price.toLocaleString('en-US')}</p>
        <p>{product.description}</p>
        <dl>
          <div><dt>Materiales</dt><dd>{product.materials.join(' · ')}</dd></div>
          <div><dt>Dimensiones</dt><dd>{product.dimensions}</dd></div>
          <div className="color-detail"><dt>Colores</dt><dd>{variants.length ? <div className="color-picker" role="radiogroup" aria-label="Selecciona un color">{variants.map((variant) => <button type="button" key={variant.id} className={variant.id === selectedVariant?.id ? 'selected' : ''} aria-checked={variant.id === selectedVariant?.id} role="radio" onClick={() => { setSelectedVariantId(variant.id); if (inSpace) planner.updateColor(product.id, variant.name); }} title={variant.name}><i style={{ backgroundColor: variant.hex }}/><span className="sr-only">{variant.name}</span></button>)}</div> : 'Consulta disponibilidad'}</dd></div>
        </dl>
        <CatalogAdvisor context={product} products={products}/>
        <a className="dark-button full" href={whatsappLink(`Hola, me interesa ${product.name} en color ${selectedColorName}. La vi en el sitio web y quisiera más información.`)} onClick={() => trackEvent('contact_whatsapp', { location: 'product_detail', item_id: product.id, item_name: product.name })} target="_blank" rel="noreferrer">Consultar por WhatsApp</a>
        <button className="save" onClick={() => { if (inSpace) { planner.remove(product.id); trackEvent('remove_from_space', { item_id: product.id, item_name: product.name }); } else { planner.add(product.id, selectedColorName, roomForProductCategory(product.category)); trackEvent('add_to_space', { item_id: product.id, item_name: product.name, item_category: product.category, value: product.price, currency: 'USD' }); } }}><Heart fill={inSpace ? 'currentColor' : 'none'}/> {inSpace ? 'En mi espacio' : 'Añadir a mi espacio'}</button>
        <ul>{['Materiales seleccionados para durar', 'Entrega coordinada y atención personal', 'Asesoría para tu espacio'].map((item) => <li key={item}><Check/>{item}</li>)}</ul>
      </div>
    </div>
    <div className="section-head"><h2>También puede gustarte</h2></div>
    <div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item}/>)}</div>
  </section>;
}
