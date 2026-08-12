import { LoaderCircle, MessageCircle, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';
import { whatsappLink } from '../config/business';
import type { Product } from '../types/catalog';

type Recommendation = { message: string; productIds: string[]; source: 'ai' | 'catalog' };

const keywords: Array<[string, string[]]> = [
  ['sala', ['sala', 'sofá', 'sofa', 'centro']],
  ['comedor', ['comedor', 'mesa', 'silla', 'seis personas']],
  ['dormitorio', ['dormitorio', 'cama', 'descanso', 'queen']],
  ['oficina', ['oficina', 'escritorio', 'trabajo', 'estudio']],
  ['claro', ['claro', 'arena', 'crema', 'marfil', 'piedra']],
  ['madera', ['madera', 'roble', 'nogal', 'fresno']],
];
const roomGroups = [
  ['sala', ['sala', 'sofá', 'sofa', 'centro']],
  ['comedor', ['comedor', 'mesa', 'silla', 'seis personas']],
  ['dormitorio', ['dormitorio', 'cama', 'descanso', 'queen']],
  ['oficina', ['oficina', 'escritorio', 'trabajo', 'estudio']],
] as const;
const stopWords = new Set(['para', 'quiero', 'tengo', 'busco', 'necesito', 'una', 'unos', 'unas', 'con', 'por', 'que', 'del', 'las', 'los', 'una', 'este', 'esta', 'como', 'muy']);
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-EC').replace(/[^a-z0-9]+/g, ' ').trim();

function localRecommendation(request: string): Recommendation {
  const terms = normalize(request);
  const meaningfulTerms = terms.split(' ').filter((term) => term.length > 2 && !stopWords.has(term));
  const roomMatch = roomGroups.find(([, aliases]) => aliases.some((alias) => terms.includes(alias)));
  const matches = products
    .map((product) => {
      const haystack = normalize([product.name, product.category, product.description, ...product.materials, ...product.colors, ...product.tags].join(' '));
      const directScore = meaningfulTerms.filter((term) => haystack.includes(term)).length;
      const intentScore = keywords.reduce((score, [, aliases]) => score + (aliases.some((alias) => terms.includes(alias) && haystack.includes(alias)) ? 2 : 0), 0);
      return { product, score: directScore + intentScore };
    })
    .sort((a, b) => b.score - a.score || Number(b.product.featured) - Number(a.product.featured))
    .filter(({ product, score }) => {
      const productTerms = normalize([product.name, product.category, ...product.tags].join(' '));
      return score > 0 && (!roomMatch || roomMatch[1].some((alias) => productTerms.includes(alias)));
    })
    .slice(0, 3)
    .map(({ product }) => product);

  const selected = matches.length ? matches : products.filter((product) => product.featured).slice(0, 3);
  return {
    source: 'catalog',
    productIds: selected.map(({ id }) => id),
    message: matches.length
      ? 'Encontré piezas del catálogo que responden a lo que buscas. Revísalas y escríbenos para confirmar medidas, acabados y disponibilidad.'
      : 'Te dejo tres piezas destacadas como punto de partida. Cuéntanos las medidas de tu espacio para afinar la selección.',
  };
}

export function CatalogAdvisor({ context }: { context?: Product }) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState(context ? `Quiero combinar ${context.name} en mi espacio.` : '');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = request.trim();
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, contextProductId: context?.id }) });
      if (!response.ok) throw new Error('AI unavailable');
      const result = await response.json() as Omit<Recommendation, 'source'>;
      setRecommendation({ ...result, source: 'ai' });
    } catch {
      setRecommendation(localRecommendation(query));
    } finally {
      setLoading(false);
    }
  };

  const recommendedProducts = recommendation ? products.filter((product) => recommendation.productIds.includes(product.id)) : [];

  return <>
    <button className="advisor-trigger" type="button" onClick={() => setOpen(true)}><Sparkles/> ¿Necesitas ayuda para elegir?</button>
    {open && <div className="advisor-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <aside className="catalog-advisor" role="dialog" aria-modal="true" aria-labelledby="advisor-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="advisor-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar asesoría"><X/></button>
        <p className="eyebrow"><Sparkles/> ASESORÍA DE CATÁLOGO</p>
        <h2 id="advisor-title">Encuentra piezas que tengan sentido para tu espacio.</h2>
        <p className="advisor-intro">Describe el ambiente, las medidas o lo que quieres resolver. Solo sugerimos piezas del catálogo de Casa Nativa.</p>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="advisor-request">Describe tu espacio</label>
          <textarea id="advisor-request" value={request} onChange={(event) => setRequest(event.target.value)} placeholder="Por ejemplo: sala de 3 × 4 m, mucha luz, quiero un sofá claro…" />
          <div className="advisor-suggestions">
            <button type="button" onClick={() => setRequest('Busco una mesa de comedor de madera para seis personas.')}>Comedor para seis</button>
            <button type="button" onClick={() => setRequest('Tengo una sala pequeña y quiero un sofá claro.')}>Sala pequeña</button>
          </div>
          <button className="dark-button" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin"/> Buscando</> : <>Ver recomendaciones <Sparkles/></>}</button>
        </form>
        {recommendation && <section className="advisor-results" aria-live="polite">
          <p className="advisor-source">{recommendation.source === 'ai' ? 'SELECCIÓN GUIADA' : 'SELECCIÓN DEL CATÁLOGO'}</p>
          <p>{recommendation.message}</p>
          <div>{recommendedProducts.map((product) => <Link key={product.id} to={`/catalog/${product.slug}`} onClick={() => setOpen(false)}><img src={product.images[0]} alt=""/><span><b>{product.name}</b><small>{product.category} · ${product.price.toLocaleString('en-US')}</small></span></Link>)}</div>
          <a className="advisor-whatsapp" href={whatsappLink(`Hola, quiero ayuda con esta selección: ${recommendedProducts.map((product) => product.name).join(', ')}.`)} target="_blank" rel="noreferrer"><MessageCircle/> Revisar selección por WhatsApp</a>
        </section>}
      </aside>
    </div>}
  </>;
}
