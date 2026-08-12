import { ArrowRight, Check, Clock3, Heart, MapPin, Ruler, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappLink } from '../config/business';
import { useCatalog } from '../hooks/useCatalog';
import { useSpacePlanner } from '../hooks/useSpacePlanner';
import { productColorVariants } from '../lib/colorVariants';

const roomOptions = ['Sala', 'Comedor', 'Dormitorio', 'Oficina'] as const;
type Room = typeof roomOptions[number];

export function SpacePlanner() {
  const { products, isLoading } = useCatalog();
  const planner = useSpacePlanner();
  const [room, setRoom] = useState<Room>('Sala');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [budget, setBudget] = useState('');

  const selectedItems = useMemo(() => planner.items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return product ? [{ ...item, product }] : [];
  }), [planner.items, products]);
  const total = selectedItems.reduce((sum, item) => sum + item.product.price, 0);
  const usableArea = Number(width) && Number(depth) ? Number(width) * Number(depth) : null;
  const budgetValue = Number(budget) || null;
  const budgetStatus = budgetValue ? total <= budgetValue : null;
  const areaStatus = usableArea ? selectedItems.length * 1.8 <= usableArea : null;
  const message = `Hola, quiero asesoría para mi ${room.toLowerCase()}.\n\nMedidas disponibles: ${width || 'por definir'} m × ${depth || 'por definir'} m\nPresupuesto: ${budgetValue ? `$${budgetValue.toLocaleString('en-US')}` : 'por definir'}\n\nPiezas que me interesan:\n${selectedItems.map((item) => `• ${item.product.name}${item.colorName ? ` (${item.colorName})` : ''} — $${item.product.price.toLocaleString('en-US')}`).join('\n')}\n\nTotal estimado: $${total.toLocaleString('en-US')}.`;

  if (isLoading && !products.length) return <section className="space-planner empty"><p className="eyebrow">MI ESPACIO</p><h2>Preparando tu propuesta…</h2></section>;

  return <section className="space-planner">
    <div className="space-hero"><div><p className="eyebrow">MI ESPACIO</p><h1>Una selección<br/><em>que conversa.</em></h1><p>Guarda las piezas que te interesan y danos el contexto para ayudarte a reunirlas bien.</p></div><div className="space-total"><span>{selectedItems.length} {selectedItems.length === 1 ? 'pieza' : 'piezas'}</span><b>${total.toLocaleString('en-US')}</b><small>Total estimado</small></div></div>
    <div className="space-layout">
      <section className="space-selection">
        <div className="space-section-head"><div><p className="eyebrow">TU SELECCIÓN</p><h2>{selectedItems.length ? 'Piezas que elegiste.' : 'Tu espacio empieza aquí.'}</h2></div>{selectedItems.length > 0 && <button type="button" onClick={planner.clear}>Vaciar selección</button>}</div>
        {selectedItems.length ? <div className="space-items">{selectedItems.map(({ product, colorName }) => {
          const variants = productColorVariants(product);
          const selectedColor = variants.find((variant) => variant.name === colorName) ?? variants[0];
          const image = selectedColor?.imageUrl ?? product.images[0];
          return <article key={product.id} className="space-item"><img src={image} alt={product.name}/><div><p className="eyebrow">{product.category}</p><h3>{product.name}</h3><b>${product.price.toLocaleString('en-US')}</b><label>Color<select value={colorName ?? selectedColor?.name ?? ''} onChange={(event) => planner.updateColor(product.id, event.target.value)}>{variants.map((variant) => <option key={variant.id}>{variant.name}</option>)}</select></label></div><button className="space-remove" type="button" onClick={() => planner.remove(product.id)} aria-label={`Quitar ${product.name}`}><Trash2/></button></article>;
        })}</div> : <div className="space-empty"><Heart/><h2>Guarda piezas desde el catálogo.</h2><p>Cuando veas una que te interese, usa “Añadir a mi espacio”. Aquí podrás revisarlas como una propuesta completa.</p><Link className="dark-button" to="/catalog">Explorar catálogo <ArrowRight/></Link></div>}
      </section>
      <aside className="space-brief">
        <p className="eyebrow">CUÉNTANOS EL CONTEXTO</p><h2>Hagamos que<br/><em>sí encaje.</em></h2>
        <fieldset><legend>¿Qué espacio estás pensando?</legend><div className="room-options">{roomOptions.map((option) => <button type="button" className={room === option ? 'selected' : ''} onClick={() => setRoom(option)} key={option}>{option}</button>)}</div></fieldset>
        <fieldset><legend><Ruler/> Medidas aproximadas (metros)</legend><div className="measurements"><label>Ancho<input type="number" min="0" step="0.1" value={width} onChange={(event) => setWidth(event.target.value)} placeholder="Ej. 4.2"/></label><span>×</span><label>Fondo<input type="number" min="0" step="0.1" value={depth} onChange={(event) => setDepth(event.target.value)} placeholder="Ej. 3.5"/></label></div></fieldset>
        <fieldset><legend>Presupuesto estimado (USD)</legend><label className="budget-input">$<input type="number" min="0" step="50" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Ej. 2500"/></label></fieldset>
        {selectedItems.length > 0 && <div className="space-feedback"><p><Check/><span><b>{budgetStatus === null ? 'Define un presupuesto' : budgetStatus ? 'La selección está dentro del presupuesto' : 'La selección supera el presupuesto'}</b>{budgetStatus === null ? 'Te ayudaremos a priorizar según tu inversión.' : budgetStatus ? ` Quedan $${(budgetValue! - total).toLocaleString('en-US')} para complementar.` : ` Ajustemos $${(total - budgetValue!).toLocaleString('en-US')} juntos.`}</span></p><p><MapPin/><span><b>{areaStatus === null ? 'Añade las medidas del espacio' : areaStatus ? 'Punto de partida razonable' : 'Conviene revisar la distribución'}</b>{areaStatus === null ? 'Así revisamos circulación y proporciones.' : areaStatus ? 'Confirmaremos proporciones y circulación contigo.' : 'La propuesta necesita una segunda mirada de escala.'}</span></p></div>}
        <a className={`dark-button full ${selectedItems.length ? '' : 'disabled'}`} href={selectedItems.length ? whatsappLink(message) : undefined} target={selectedItems.length ? '_blank' : undefined} rel="noreferrer" aria-disabled={!selectedItems.length}>Enviar mi propuesta <ArrowRight/></a>
        <p className="space-note"><Clock3/> Te respondemos con disponibilidad, proporciones y una recomendación para tu {room.toLowerCase()}.</p>
      </aside>
    </div>
  </section>;
}
