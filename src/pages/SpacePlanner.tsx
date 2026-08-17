import { ArrowRight, Check, Clock3, Heart, MapPin, Ruler, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappLink } from '../config/business';
import { useCatalog } from '../hooks/useCatalog';
import { useSpacePlanner } from '../hooks/useSpacePlanner';
import { productColorVariants } from '../lib/colorVariants';
import { isComEmail, isValidPhone, onlyDecimal, onlyDigits } from '../lib/formValidation';
import { estimateSpace } from '../lib/spacePlanning';
import { saveSpaceProposal } from '../services/spaceProposals';
import { trackEvent } from '../lib/analytics';

const roomOptions = ['Sala', 'Comedor', 'Dormitorio', 'Oficina'] as const;
type Room = typeof roomOptions[number];
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ProposalRoute = 'choose' | 'direct' | 'review';

export function SpacePlanner() {
  const { products, isLoading } = useCatalog();
  const planner = useSpacePlanner();
  const [room, setRoom] = useState<Room>('Sala');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [budget, setBudget] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [website, setWebsite] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [proposalRoute, setProposalRoute] = useState<ProposalRoute>('choose');

  const selectedItems = useMemo(() => planner.items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return product ? [{ ...item, product }] : [];
  }), [planner.items, products]);
  const total = selectedItems.reduce((sum, item) => sum + item.product.price, 0);
  const widthValue = Number(width) || null;
  const depthValue = Number(depth) || null;
  const budgetValue = Number(budget) || null;
  const budgetStatus = budgetValue ? total <= budgetValue : null;
  const space = useMemo(() => estimateSpace(selectedItems.map((item) => item.product), widthValue, depthValue), [selectedItems, widthValue, depthValue]);
  const needsContact = !contactName.trim() || !isValidPhone(contactPhone.trim()) || Boolean(contactEmail.trim() && !isComEmail(contactEmail)) || !privacyAccepted;
  const proposalRoom = proposalRoute === 'review' ? room : 'Por definir';
  const selectedPiecesMessage = selectedItems.map((item) => `• ${item.product.name}${item.colorName ? ` (${item.colorName})` : ''} — $${item.product.price.toLocaleString('en-US')}`).join('\n');
  const message = proposalRoute === 'review'
    ? `Hola, quiero asesoría para mi ${room.toLowerCase()}.\n\nMedidas disponibles: ${width || 'por definir'} m × ${depth || 'por definir'} m\nPresupuesto: ${budgetValue ? `$${budgetValue.toLocaleString('en-US')}` : 'por definir'}\n\nPiezas que me interesan:\n${selectedPiecesMessage}\n\nTotal estimado: $${total.toLocaleString('en-US')}.`
    : `Hola, me interesan estas piezas:\n${selectedPiecesMessage}\n\nTotal estimado: $${total.toLocaleString('en-US')}.\n\n¿Podrían confirmarme disponibilidad, acabados y plazo de entrega?`;

  const chooseProposalRoute = (route: Exclude<ProposalRoute, 'choose'>) => {
    setProposalRoute(route);
    setSaveState('idle');
    setSaveError('');
  };

  const saveProposal = async () => {
    if (!selectedItems.length || needsContact) {
      setSaveState('error');
      setSaveError('Completa tus datos y acepta la Política de privacidad para enviar la propuesta.');
      return;
    }

    setSaveState('saving');
    setSaveError('');
    try {
      await saveSpaceProposal({
        roomType: proposalRoom,
        roomWidthCm: proposalRoute === 'review' && widthValue ? Math.round(widthValue * 100) : null,
        roomDepthCm: proposalRoute === 'review' && depthValue ? Math.round(depthValue * 100) : null,
        budget: proposalRoute === 'review' ? budgetValue : null,
        totalPrice: total,
        requiredAreaSqm: proposalRoute === 'review' ? space.requiredAreaSqm : null,
        furnitureFootprintSqm: proposalRoute === 'review' ? space.furnitureFootprintSqm : null,
        items: selectedItems.map((item) => ({
          productId: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          category: item.product.category,
          colorName: item.colorName,
          price: item.product.price,
          dimensions: item.product.dimensions,
        })),
        contactName,
        contactPhone,
        contactEmail,
        notes,
        website,
        privacyAccepted,
      });
      trackEvent('generate_lead', { currency: 'USD', value: total, room_type: proposalRoom, item_count: selectedItems.length });
      setSaveState('saved');
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'No pudimos guardar la propuesta. Inténtalo otra vez.');
    }
  };

  if (isLoading && !products.length) return <section className="space-planner empty"><p className="eyebrow">MI ESPACIO</p><h2>Preparando tu propuesta…</h2></section>;

  const spaceHeading = space.roomAreaSqm === null
    ? 'Añade las medidas del espacio'
    : space.fitsArea
      ? 'Hay margen para circular'
      : 'Conviene revisar la distribución';
  const spaceDetail = space.roomAreaSqm === null
    ? 'Usamos las medidas reales de cada pieza y un margen de paso para orientarte.'
    : space.itemsThatDoNotFit.length
      ? `${space.itemsThatDoNotFit.join(', ')} necesita una revisión de escala o de orientación.`
      : space.fitsArea
        ? `Tu espacio tiene ${space.roomAreaSqm.toFixed(1)} m²; la selección reserva ${space.requiredAreaSqm.toFixed(1)} m² entre piezas y paso.`
        : `Tu espacio tiene ${space.roomAreaSqm.toFixed(1)} m²; recomendamos cerca de ${space.requiredAreaSqm.toFixed(1)} m² para las piezas y su circulación.`;

  return <section className="space-planner">
    <div className="space-hero"><div><p className="eyebrow">MI ESPACIO</p><h1>Una selección<br/><em>a tu ritmo.</em></h1><p>Guarda las piezas que te interesan. Después puedes solicitarlas directamente o revisar si encajan en tu espacio.</p></div><div className="space-total"><span>{selectedItems.length} {selectedItems.length === 1 ? 'pieza' : 'piezas'}</span><b>${total.toLocaleString('en-US')}</b><small>Total estimado</small></div></div>
    <div className="space-layout">
      <section className="space-selection">
        <div className="space-section-head"><div><p className="eyebrow">TU SELECCIÓN</p><h2>{selectedItems.length ? 'Piezas que elegiste.' : 'Tu espacio empieza aquí.'}</h2></div>{selectedItems.length > 0 && <button type="button" onClick={planner.clear}>Vaciar selección</button>}</div>
        {selectedItems.length ? <div className="space-items">{selectedItems.map(({ product, colorName }) => {
          const variants = productColorVariants(product);
          const selectedColor = variants.find((variant) => variant.name === colorName) ?? variants[0];
          const image = selectedColor?.imageUrl ?? product.images[0];
          const requirement = space.requirements.find((item) => item.productId === product.id);
          return <article key={product.id} className="space-item"><img src={image} alt={product.name} loading="lazy" decoding="async"/><div><p className="eyebrow">{product.category}</p><h3>{product.name}</h3><b>${product.price.toLocaleString('en-US')}</b><label>Color<select value={colorName ?? selectedColor?.name ?? ''} onChange={(event) => planner.updateColor(product.id, event.target.value)}>{variants.map((variant) => <option key={variant.id}>{variant.name}</option>)}</select></label>{requirement && <small className="space-item-rule">Huella: {(requirement.widthCm / 100).toFixed(2)} × {(requirement.depthCm / 100).toFixed(2)} m · paso recomendado: {requirement.clearanceCm} cm</small>}</div><button className="space-remove" type="button" onClick={() => planner.remove(product.id)} aria-label={`Quitar ${product.name}`}><Trash2/></button></article>;
        })}</div> : <div className="space-empty"><Heart/><h2>Guarda piezas desde el catálogo.</h2><p>Cuando veas una que te interese, usa “Añadir a mi espacio”. Aquí podrás revisarlas como una propuesta completa.</p><Link className="dark-button" to="/catalog">Explorar catálogo <ArrowRight/></Link></div>}
      </section>
      <aside className="space-brief">
        {!selectedItems.length ? <div className="space-general-inquiry"><p className="eyebrow">¿AÚN NO TIENES PIEZAS?</p><h2>Empecemos por<br/><em>lo que buscas.</em></h2><p>Cuéntanos qué necesitas y te ayudamos a empezar sin elegir un producto todavía.</p><Link to="/contact#contact-form">Enviar una consulta <ArrowRight/></Link></div> : proposalRoute === 'choose' ? <div className="proposal-paths"><p className="eyebrow">¿CÓMO QUIERES CONTINUAR?</p><h2>Tu selección<br/>ya está <em>lista.</em></h2><p>Solicita estas piezas tal como están o revisa medidas y presupuesto antes de hablar con nosotros.</p><button className="proposal-path" type="button" onClick={() => chooseProposalRoute('direct')}><span><Check/></span><div><b>Solicitar estas piezas</b><small>Confirma disponibilidad, acabados y entrega.</small></div><ArrowRight/></button><button className="proposal-path" type="button" onClick={() => chooseProposalRoute('review')}><span><Ruler/></span><div><b>Revisar si encajan</b><small>Usa medidas y presupuesto para una recomendación más precisa.</small></div><ArrowRight/></button><Link className="proposal-add-items" to="/catalog">Agregar otra pieza <ArrowRight/></Link></div> : <>
          <div className="proposal-route-head"><p className="eyebrow">{proposalRoute === 'review' ? 'ASESORÍA DE ESPACIO' : 'SOLICITAR PIEZAS'}</p><h2>{proposalRoute === 'review' ? <>Hagamos que<br/><em>sí encaje.</em></> : <>Hablemos de tu<br/><em>selección.</em></>}</h2><p>{proposalRoute === 'review' ? 'Estos datos son opcionales, pero nos ayudan a revisar proporciones y alternativas.' : 'No necesitas medidas ni presupuesto. Solo confirma cómo podemos contactarte.'}</p><button className="proposal-change-route" type="button" onClick={() => { setProposalRoute('choose'); setSaveState('idle'); setSaveError(''); }}>Cambiar opción</button></div>
          {proposalRoute === 'review' && <><fieldset><legend>¿Qué espacio estás pensando?</legend><div className="room-options">{roomOptions.map((option) => <button type="button" className={room === option ? 'selected' : ''} onClick={() => setRoom(option)} key={option}>{option}</button>)}</div></fieldset><fieldset><legend><Ruler/> Medidas aproximadas <small>(opcionales)</small></legend><div className="measurements"><label>Ancho<input type="text" inputMode="decimal" value={width} onChange={(event) => setWidth(onlyDecimal(event.target.value))} placeholder="Ej. 4.2"/></label><span>×</span><label>Fondo<input type="text" inputMode="decimal" value={depth} onChange={(event) => setDepth(onlyDecimal(event.target.value))} placeholder="Ej. 3.5"/></label></div></fieldset><fieldset><legend>Presupuesto estimado <small>(opcional)</small></legend><label className="budget-input">$<input type="text" inputMode="numeric" value={budget} onChange={(event) => setBudget(onlyDigits(event.target.value, 9))} placeholder="Ej. 2500"/></label></fieldset><div className="space-feedback"><p><Check/><span><b>{budgetStatus === null ? 'Presupuesto por definir' : budgetStatus ? 'La selección está dentro del presupuesto' : 'La selección supera el presupuesto'}</b>{budgetStatus === null ? 'Podemos confirmar alternativas sin usar un rango de inversión.' : budgetStatus ? ` Quedan $${(budgetValue! - total).toLocaleString('en-US')} para complementar.` : ` Ajustemos $${(total - budgetValue!).toLocaleString('en-US')} juntos.`}</span></p><p><MapPin/><span><b>{spaceHeading}</b>{spaceDetail}</span></p></div></>}
          <div className="proposal-contact"><p className="eyebrow">{proposalRoute === 'review' ? 'RECIBE LA REVISIÓN' : 'SOLICITA ESTAS PIEZAS'}</p><div className="proposal-fields"><label>Nombre<input value={contactName} onChange={(event) => setContactName(event.target.value)} autoComplete="name" minLength={2} maxLength={100} placeholder="Tu nombre"/></label><label>WhatsApp<input value={contactPhone} onChange={(event) => setContactPhone(onlyDigits(event.target.value))} autoComplete="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Ej. 0986951419"/></label><label>Correo <small>(opcional)</small><input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} autoComplete="email" inputMode="email" type="email" maxLength={254} placeholder="correo@ejemplo.com"/></label><label>Algo que debamos considerar <small>(opcional)</small><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} placeholder={proposalRoute === 'review' ? 'Puertas, ventanas, fecha o acabados…' : 'Color, acabados o fecha en la que te gustaría recibirlas…'}/></label><label className="legal-consent"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)}/><span>Autorizo el uso de mis datos según la <Link to="/privacy" target="_blank">Política de privacidad</Link>. Conozco los <Link to="/terms" target="_blank">Términos</Link>.</span></label><label className="proposal-honeypot" aria-hidden="true">Sitio web<input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off"/></label></div></div>
          {saveState === 'saved' ? <div className="proposal-success"><Check/><div><b>{proposalRoute === 'review' ? 'Tu solicitud de revisión quedó registrada.' : 'Tu solicitud quedó registrada.'}</b><span>Cuando quieras, abre WhatsApp para conversar con el showroom.</span></div></div> : <button className="dark-button full" type="button" onClick={saveProposal} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Guardando…' : proposalRoute === 'review' ? 'Guardar solicitud de revisión' : 'Guardar solicitud'} <ArrowRight/></button>}
          {saveState === 'saved' && <a className="dark-button full proposal-whatsapp" href={whatsappLink(message)} onClick={() => trackEvent('contact_whatsapp', { location: proposalRoute === 'review' ? 'space_review' : 'space_request', item_count: selectedItems.length, value: total, currency: 'USD' })} target="_blank" rel="noreferrer">{proposalRoute === 'review' ? 'Abrir WhatsApp con mi revisión' : 'Abrir WhatsApp para consultar'} <ArrowRight/></a>}
          {saveState === 'error' && <p className="proposal-error" role="alert">{saveError}</p>}
          <p className="space-note"><Clock3/> {proposalRoute === 'review' ? `Te respondemos con disponibilidad, proporciones y una recomendación para tu ${room.toLowerCase()}.` : 'Te respondemos con disponibilidad, acabados y plazo de entrega.'}</p>
        </>}
      </aside>
    </div>
  </section>;
}
