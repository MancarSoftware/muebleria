import { ArrowLeft, ArrowRight, Check, LoaderCircle, MessageCircle, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { products as fallbackProducts } from '../data/products';
import { whatsappLink } from '../config/business';
import type { AdvisorProfile, AdvisorResponse, AdvisorSpace } from '../types/advisor';
import type { Product } from '../types/catalog';

type ResponseWithSource = AdvisorResponse & { source: 'ai' | 'catalog' };

const spaces: Array<{ value: AdvisorSpace; label: string; detail: string }> = [
  { value: 'sala', label: 'Sala', detail: 'Convivir y descansar' },
  { value: 'comedor', label: 'Comedor', detail: 'Reunirse alrededor' },
  { value: 'dormitorio', label: 'Dormitorio', detail: 'Descanso sereno' },
  { value: 'oficina', label: 'Estudio', detail: 'Concentrarse mejor' },
];
const sizes = [{ value: 'compacto', label: 'Compacto', detail: 'Quiero cuidar cada paso' }, { value: 'medio', label: 'Intermedio', detail: 'Busco equilibrio y presencia' }, { value: 'amplio', label: 'Amplio', detail: 'Tengo margen para crecer' }] as const;
const budgets = [{ value: 600, label: 'Hasta $600' }, { value: 1200, label: 'Hasta $1,200' }, { value: 1500, label: 'Hasta $1,500' }] as const;
const priorities = [{ value: 'confort', label: 'Confort' }, { value: 'reunir', label: 'Reunir' }, { value: 'descansar', label: 'Descansar' }, { value: 'trabajar', label: 'Trabajar' }] as const;
const spaceTags: Record<AdvisorSpace, string[]> = { sala: ['sala'], comedor: ['comedor'], dormitorio: ['dormitorio'], oficina: ['oficina'] };
const priorityTags = { confort: ['sofá', 'sofa', 'sala'], reunir: ['mesa', 'silla', 'comedor'], descansar: ['cama', 'dormitorio'], trabajar: ['escritorio', 'oficina'] };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-EC');

function inferredSpace(product?: Product): AdvisorSpace | null {
  if (!product) return null;
  return (Object.keys(spaceTags) as AdvisorSpace[]).find((space) => spaceTags[space].some((tag) => product.tags.includes(tag))) ?? null;
}

function initialProfile(context?: Product): AdvisorProfile {
  const fallback: AdvisorProfile = { space: inferredSpace(context), size: null, budget: null, priority: null, measurements: '', notes: '', contextProductId: context?.id };
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem('casa-nativa-advisor') || '{}') as Partial<AdvisorProfile>;
    return { ...fallback, ...saved, contextProductId: context?.id };
  } catch { return fallback; }
}

function roomLimit(measurements: string) {
  const values = measurements.match(/\d+(?:[.,]\d+)?/g)?.map((value) => Number(value.replace(',', '.'))) ?? [];
  if (values.length < 2) return null;
  const centimetres = values.map((value) => value > 20 ? value : value * 100);
  return Math.max(...centimetres);
}

function catalogFallback(profile: AdvisorProfile, catalogProducts: Product[]): ResponseWithSource {
  const spaceProducts = profile.space ? catalogProducts.filter((product) => spaceTags[profile.space!].some((tag) => product.tags.includes(tag))) : catalogProducts;
  const budgetProducts = profile.budget ? spaceProducts.filter((product) => product.price <= profile.budget!) : spaceProducts;
  const limit = roomLimit(profile.measurements);
  const dimensionProducts = limit ? budgetProducts.filter((product) => (Number(product.dimensions.match(/\d+/)?.[0]) || 0) <= limit - 40) : budgetProducts;
  const priority = profile.priority ? priorityTags[profile.priority] : [];
  const selected = dimensionProducts
    .map((product) => ({ product, score: Number(product.featured) + priority.reduce((score, tag) => score + Number(normalize([product.name, product.category, ...product.tags].join(' ')).includes(normalize(tag))), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ product }) => ({ productId: product.id, reason: profile.priority ? `Responde a tu prioridad de ${priorities.find(({ value }) => value === profile.priority)?.label.toLocaleLowerCase('es-EC')}.` : 'Encaja con el ambiente que elegiste.' }));

  const constrained = budgetProducts.length === 0 ? 'presupuesto' : limit && dimensionProducts.length === 0 ? 'medidas' : '';
  return {
    source: 'catalog',
    recommendations: selected,
    availabilityNote: 'La disponibilidad, acabados y fecha de entrega se confirman con el showroom antes de reservar.',
    message: constrained
      ? `No encontramos piezas actuales que cumplan exactamente con tu ${constrained}. Escríbenos y buscaremos una alternativa o próxima llegada.`
      : 'Esta selección se filtró por el ambiente, presupuesto y preferencias que compartiste.',
  };
}

export function CatalogAdvisor({ context, products: catalogProducts = fallbackProducts }: { context?: Product; products?: Product[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<AdvisorProfile>(() => initialProfile(context));
  const [result, setResult] = useState<ResponseWithSource | null>(null);
  const [loading, setLoading] = useState(false);

  const patchProfile = (next: Partial<AdvisorProfile>) => setProfile((current) => ({ ...current, ...next }));
  const close = () => { setOpen(false); setResult(null); setStep(0); };
  const canAdvance = step === 0 ? Boolean(profile.space) : step === 1 ? Boolean(profile.size) : Boolean(profile.priority);
  const selectedProducts = result ? result.recommendations.map(({ productId, reason }) => ({ product: catalogProducts.find((item) => item.id === productId), reason })).filter((item): item is { product: Product; reason: string } => Boolean(item.product)) : [];

  const submit = async () => {
    if (!profile.space || !profile.size || !profile.priority) return;
    setLoading(true);
    try {
      window.sessionStorage.setItem('casa-nativa-advisor', JSON.stringify(profile));
      const response = await fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) });
      if (!response.ok) throw new Error('AI unavailable');
      setResult({ ...(await response.json() as AdvisorResponse), source: 'ai' });
    } catch {
      setResult(catalogFallback(profile, catalogProducts));
    } finally { setLoading(false); }
  };

  const whatsappMessage = `Hola, quiero revisar esta selección para mi ${spaces.find(({ value }) => value === profile.space)?.label.toLocaleLowerCase('es-EC') || 'espacio'}: ${selectedProducts.map(({ product }) => product.name).join(', ') || 'sin coincidencias exactas'}. Presupuesto: ${profile.budget ? `$${profile.budget}` : 'por definir'}. Medidas: ${profile.measurements || 'por confirmar'}.`;

  return <>
    <button className="advisor-trigger" type="button" onClick={() => setOpen(true)}><Sparkles/> ¿Necesitas ayuda para elegir?</button>
    {open && <div className="advisor-backdrop" role="presentation" onMouseDown={close}>
      <aside className="catalog-advisor" role="dialog" aria-modal="true" aria-labelledby="advisor-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="advisor-close" type="button" onClick={close} aria-label="Cerrar asesoría"><X/></button>
        <p className="eyebrow"><Sparkles/> ASESORÍA DE CATÁLOGO</p>
        <ol className="advisor-steps" aria-label="Progreso de asesoría"><li className={step === 0 ? 'active' : step > 0 ? 'complete' : ''}>01 <span>Espacio</span></li><li className={step === 1 ? 'active' : step > 1 ? 'complete' : ''}>02 <span>Medidas</span></li><li className={step === 2 ? 'active' : ''}>03 <span>Prioridad</span></li></ol>
        {!result && <>
          {step === 0 && <section className="advisor-step"><h2 id="advisor-title">¿Qué espacio quieres resolver?</h2><p>Empezamos por el ambiente para no mezclar piezas que no pertenecen a tu necesidad.</p><div className="advisor-options advisor-space-options">{spaces.map((option) => <button type="button" className={profile.space === option.value ? 'selected' : ''} onClick={() => patchProfile({ space: option.value })} key={option.value}><b>{option.label}</b><span>{option.detail}</span><Check/></button>)}</div></section>}
          {step === 1 && <section className="advisor-step"><h2 id="advisor-title">¿Con cuánto espacio cuentas?</h2><p>Elige una escala y, si la sabes, añade las medidas aproximadas.</p><div className="advisor-options">{sizes.map((option) => <button type="button" className={profile.size === option.value ? 'selected' : ''} onClick={() => patchProfile({ size: option.value })} key={option.value}><b>{option.label}</b><span>{option.detail}</span><Check/></button>)}</div><label className="advisor-input"><span>Medidas aproximadas <em>opcional</em></span><input value={profile.measurements} onChange={(event) => patchProfile({ measurements: event.target.value })} placeholder="Ej. 3 × 4 m" /></label></section>}
          {step === 2 && <section className="advisor-step"><h2 id="advisor-title">Define la decisión importante.</h2><p>El presupuesto excluye piezas que no puedes considerar; la prioridad ordena las restantes.</p><p className="advisor-field-label">PRESUPUESTO</p><div className="advisor-budget-options"><button type="button" className={profile.budget === null ? 'selected' : ''} onClick={() => patchProfile({ budget: null })}>A definir</button>{budgets.map((option) => <button type="button" className={profile.budget === option.value ? 'selected' : ''} onClick={() => patchProfile({ budget: option.value })} key={option.value}>{option.label}</button>)}</div><p className="advisor-field-label">PRIORIDAD</p><div className="advisor-priority-options">{priorities.map((option) => <button type="button" className={profile.priority === option.value ? 'selected' : ''} onClick={() => patchProfile({ priority: option.value })} key={option.value}>{option.label}</button>)}</div><label className="advisor-input"><span>Algo más que debamos considerar <em>opcional</em></span><textarea value={profile.notes} onChange={(event) => patchProfile({ notes: event.target.value })} placeholder="Ej. entra mucha luz, prefiero madera natural…" /></label></section>}
          <div className="advisor-controls">{step > 0 ? <button className="advisor-back" type="button" onClick={() => setStep((current) => current - 1)}><ArrowLeft/> Atrás</button> : <span/>}{step < 2 ? <button className="dark-button" type="button" disabled={!canAdvance} onClick={() => setStep((current) => current + 1)}>Continuar <ArrowRight/></button> : <button className="dark-button" type="button" disabled={!canAdvance || loading} onClick={submit}>{loading ? <><LoaderCircle className="spin"/> Seleccionando</> : <>Ver mi selección <Sparkles/></>}</button>}</div>
        </>}
        {result && <section className="advisor-results" aria-live="polite"><p className="advisor-source">{result.source === 'ai' ? 'SELECCIÓN GUIADA' : 'SELECCIÓN DEL CATÁLOGO'}</p><h2 id="advisor-title">Tu punto de partida.</h2><p>{result.message}</p>{selectedProducts.length > 0 && <div>{selectedProducts.map(({ product, reason }) => <Link key={product.id} to={`/catalog/${product.slug}`} onClick={close}><img src={product.images[0]} alt=""/><span><b>{product.name}</b><small>{product.category} · ${product.price.toLocaleString('en-US')}</small><em>{reason}</em></span></Link>)}</div>}<aside className="advisor-availability"><Check/><span><b>Disponibilidad por confirmar</b>{result.availabilityNote}</span></aside><a className="advisor-whatsapp" href={whatsappLink(whatsappMessage)} target="_blank" rel="noreferrer"><MessageCircle/> Revisar selección por WhatsApp</a><button className="advisor-start-over" type="button" onClick={() => { setResult(null); setStep(0); }}>Ajustar mi selección</button></section>}
      </aside>
    </div>}
  </>;
}
