import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CatalogAdvisor } from '../components/CatalogAdvisor';
import { ProductCard } from '../components/ProductCard';
import { useCatalog } from '../hooks/useCatalog';
import { useFavorites } from '../hooks/useFavorites';

export function Catalog() {
  const [params] = useSearchParams();
  const { ids } = useFavorites();
  const { products, isLoading } = useCatalog();
  const activeSpace = params.get('space');
  const activeCollection = params.get('collection');
  const activeFilter = activeSpace || activeCollection;
  const displayName = activeSpace || activeCollection?.replace('coleccion-', '');
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('Todos');
  const [max, setMax] = useState(2000);
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const filtered = useMemo(() => products.filter((product) => (
    (category === 'Todos' || product.category === category)
    && product.price <= max
    && (product.name + product.tags.join(' ')).toLowerCase().includes(term.toLowerCase())
    && (!activeFilter || product.tags.includes(activeFilter))
    && (!params.get('favorites') || ids.includes(product.id))
  )), [products, category, max, term, activeFilter, params, ids]);

  return <section className="catalog">
    <div className="catalog-heading"><div><p className="eyebrow">PIEZAS PARA HABITAR</p><h1>{activeFilter ? <>Piezas para tu<br/><em>{displayName}.</em></> : <>El catálogo <em>esencial.</em></>}</h1></div><CatalogAdvisor products={products}/></div>
    {activeFilter && <p className="catalog-context">Selección filtrada para esta propuesta. <Link to="/catalog">Ver catálogo completo</Link></p>}
    <div className="filters"><label><Search/><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Buscar una pieza"/></label><label><SlidersHorizontal/><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Hasta ${max}<input type="range" min="200" max="3000" step="100" value={max} onChange={(event) => setMax(+event.target.value)}/></label></div>
    <p className="count">{isLoading ? 'Actualizando catálogo…' : `${filtered.length} piezas seleccionadas`}</p>
    {filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="empty"><h2>Sin coincidencias</h2><p>Cambia tus filtros o explora el catálogo completo.</p></div>}
  </section>;
}
