import { ArrowRight, Check, Clock3, Heart, MapPin, Ruler, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappLink } from '../config/business';
import { type SpaceRoom, useSpacePlanner } from '../hooks/useSpacePlanner';
import { useCatalog } from '../hooks/useCatalog';
import { productColorVariants } from '../lib/colorVariants';
import { isComEmail, isValidPhone, onlyDecimal, onlyDigits } from '../lib/formValidation';
import { trackEvent } from '../lib/analytics';
import { estimateSpace, type SpaceEstimate } from '../lib/spacePlanning';
import { saveSpaceProposal } from '../services/spaceProposals';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ProposalRoute = 'choose' | 'direct' | 'review';

function roomFeedback(estimate: SpaceEstimate, budget: number | null, total: number) {
  const budgetStatus = budget ? total <= budget : null;
  const spaceHeading = estimate.roomAreaSqm === null
    ? 'Añade las medidas del ambiente'
    : estimate.fitsArea
      ? 'Hay margen para circular'
      : 'Conviene revisar la distribución';
  const spaceDetail = estimate.roomAreaSqm === null
    ? 'Usamos las medidas reales de cada pieza y un margen de paso para orientarte.'
    : estimate.itemsThatDoNotFit.length
      ? `${estimate.itemsThatDoNotFit.join(', ')} necesita una revisión de escala u orientación.`
      : estimate.fitsArea
        ? `El ambiente tiene ${estimate.roomAreaSqm.toFixed(1)} m²; la selección reserva ${estimate.requiredAreaSqm.toFixed(1)} m² entre piezas y paso.`
        : `El ambiente tiene ${estimate.roomAreaSqm.toFixed(1)} m²; recomendamos cerca de ${estimate.requiredAreaSqm.toFixed(1)} m² para las piezas y su circulación.`;

  return <div className="space-feedback"><p><Check/><span><b>{budgetStatus === null ? 'Presupuesto por definir' : budgetStatus ? 'La selección está dentro del presupuesto' : 'La selección supera el presupuesto'}</b>{budgetStatus === null ? ' Podemos confirmar alternativas sin usar un rango de inversión.' : budgetStatus ? ` Quedan $${(budget! - total).toLocaleString('en-US')} para complementar.` : ` Ajustemos $${(total - budget!).toLocaleString('en-US')} juntos.`}</span></p><p><MapPin/><span><b>{spaceHeading}</b>{spaceDetail}</span></p></div>;
}

function roomLabel(room: SpaceRoom, position: number, rooms: SpaceRoom[]) {
  const repeated = rooms.filter((candidate) => candidate.roomType === room.roomType).length > 1;
  const occurrence = rooms.slice(0, position + 1).filter((candidate) => candidate.roomType === room.roomType).length;
  return repeated ? `${room.roomType} ${occurrence}` : room.roomType;
}

export function SpacePlanner() {
  const { products, isLoading } = useCatalog();
  const planner = useSpacePlanner();
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [website, setWebsite] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [proposalRoute, setProposalRoute] = useState<ProposalRoute>('choose');
  const [reviewRoomIndex, setReviewRoomIndex] = useState(0);

  const selectedItems = useMemo(() => planner.items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return product ? [{ ...item, product }] : [];
  }), [planner.items, products]);
  const total = selectedItems.reduce((sum, item) => sum + item.product.price, 0);
  const planningGroups = useMemo(() => planner.rooms.map((room, position) => {
    const items = selectedItems.filter((item) => item.roomId === room.id);
    const widthValue = Number(room.width) || null;
    const depthValue = Number(room.depth) || null;
    const budgetValue = Number(room.budget) || null;
    return {
      room,
      position,
      label: roomLabel(room, position, planner.rooms),
      items,
      total: items.reduce((sum, item) => sum + item.product.price, 0),
      widthValue,
      depthValue,
      budgetValue,
      estimate: estimateSpace(items.map((item) => item.product), widthValue, depthValue),
    };
  }), [planner.rooms, selectedItems]);
  const activeGroups = planningGroups.filter((group) => group.items.length > 0);
  const activeReviewIndex = Math.min(reviewRoomIndex, Math.max(activeGroups.length - 1, 0));
  const activeReviewGroup = activeGroups[activeReviewIndex];
  const needsContact = !contactName.trim() || !isValidPhone(contactPhone.trim()) || Boolean(contactEmail.trim() && !isComEmail(contactEmail)) || !privacyAccepted;
  const proposalRoom = proposalRoute === 'review' ? activeGroups.map((group) => group.label).join(', ') || 'Por definir' : 'Selección de piezas';
  const selectedPiecesMessage = selectedItems.map((item) => `• ${item.product.name}${item.colorName ? ` (${item.colorName})` : ''} — $${item.product.price.toLocaleString('en-US')}`).join('\n');
  const message = proposalRoute === 'review'
    ? `Hola, quiero asesoría para estos ambientes:\n\n${activeGroups.map((group) => `${group.label}\nMedidas disponibles: ${group.room.width || 'por definir'} m × ${group.room.depth || 'por definir'} m\nPresupuesto: ${group.budgetValue ? `$${group.budgetValue.toLocaleString('en-US')}` : 'por definir'}\nPiezas:\n${group.items.map((item) => `• ${item.product.name}${item.colorName ? ` (${item.colorName})` : ''} — $${item.product.price.toLocaleString('en-US')}`).join('\n')}${group.room.notes.trim() ? `\nNota del ambiente: ${group.room.notes.trim()}` : ''}`).join('\n\n')}\n\nTotal estimado: $${total.toLocaleString('en-US')}.`
    : `Hola, me interesan estas piezas:\n${selectedPiecesMessage}\n\nTotal estimado: $${total.toLocaleString('en-US')}.\n\n¿Podrían confirmarme disponibilidad, acabados y plazo de entrega?`;

  const chooseProposalRoute = (route: Exclude<ProposalRoute, 'choose'>) => {
    setProposalRoute(route);
    setReviewRoomIndex(0);
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
        roomWidthCm: null,
        roomDepthCm: null,
        budget: proposalRoute === 'review' ? activeGroups.reduce((sum, group) => sum + (group.budgetValue ?? 0), 0) || null : null,
        totalPrice: total,
        requiredAreaSqm: proposalRoute === 'review' ? activeGroups.reduce((sum, group) => sum + group.estimate.requiredAreaSqm, 0) : null,
        furnitureFootprintSqm: proposalRoute === 'review' ? activeGroups.reduce((sum, group) => sum + group.estimate.furnitureFootprintSqm, 0) : null,
        spaces: proposalRoute === 'review' ? activeGroups.map((group) => ({
          roomType: group.label,
          roomWidthCm: group.widthValue ? Math.round(group.widthValue * 100) : null,
          roomDepthCm: group.depthValue ? Math.round(group.depthValue * 100) : null,
          budget: group.budgetValue,
          requiredAreaSqm: group.estimate.requiredAreaSqm,
          furnitureFootprintSqm: group.estimate.furnitureFootprintSqm,
          notes: group.room.notes,
          items: group.items.map((item) => ({ productId: item.product.id, colorName: item.colorName })),
        })) : [],
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
      trackEvent('generate_lead', { currency: 'USD', value: total, room_type: proposalRoom, item_count: selectedItems.length, room_count: activeGroups.length });
      setSaveState('saved');
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'No pudimos guardar la propuesta. Inténtalo otra vez.');
    }
  };

  if (isLoading && !products.length) return <section className="space-planner empty"><p className="eyebrow">MI ESPACIO</p><h2>Preparando tu propuesta…</h2></section>;

  return <section className="space-planner">
    <div className="space-hero"><div><p className="eyebrow">MI ESPACIO</p><h1>Una selección<br/><em>a tu ritmo.</em></h1><p>Guarda las piezas que te interesan. Después puedes solicitarlas directamente o organizar cada ambiente para revisar si encajan.</p></div><div className="space-total"><span>{selectedItems.length} {selectedItems.length === 1 ? 'pieza' : 'piezas'}</span><b>${total.toLocaleString('en-US')}</b><small>Total estimado</small></div></div>
    <div className="space-layout">
      <section className="space-selection">
        <div className="space-section-head"><div><p className="eyebrow">TU SELECCIÓN</p><h2>{selectedItems.length ? 'Piezas que elegiste.' : 'Tu espacio empieza aquí.'}</h2></div>{selectedItems.length > 0 && <button type="button" onClick={planner.clear}>Vaciar selección</button>}</div>
        {selectedItems.length ? <div className="space-items">{selectedItems.map(({ product, colorName, roomId }) => {
          const variants = productColorVariants(product);
          const selectedColor = variants.find((variant) => variant.name === colorName) ?? variants[0];
          const image = selectedColor?.imageUrl ?? product.images[0];
          const group = planningGroups.find((candidate) => candidate.room.id === roomId);
          const requirement = group?.estimate.requirements.find((item) => item.productId === product.id);
          return <article key={product.id} className="space-item"><img src={image} alt={product.name} loading="lazy" decoding="async"/><div><p className="eyebrow">{product.category}</p><h3>{product.name}</h3><b>${product.price.toLocaleString('en-US')}</b><div className="space-item-options"><label>Color<select value={colorName ?? selectedColor?.name ?? ''} onChange={(event) => planner.updateColor(product.id, event.target.value)}>{variants.map((variant) => <option key={variant.id}>{variant.name}</option>)}</select></label><label>Se ubicará en<select value={roomId} onChange={(event) => planner.assignRoom(product.id, event.target.value)}>{planner.rooms.map((room, index) => <option value={room.id} key={room.id}>{roomLabel(room, index, planner.rooms)}</option>)}</select></label></div>{requirement && <small className="space-item-rule">Huella: {(requirement.widthCm / 100).toFixed(2)} × {(requirement.depthCm / 100).toFixed(2)} m · paso recomendado: {requirement.clearanceCm} cm</small>}</div><button className="space-remove" type="button" onClick={() => planner.remove(product.id)} aria-label={`Quitar ${product.name}`}><Trash2/></button></article>;
        })}</div> : <div className="space-empty"><Heart/><h2>Guarda piezas desde el catálogo.</h2><p>Cuando veas una que te interese, usa “Añadir a mi espacio”. Aquí podrás revisarlas como una propuesta completa.</p><Link className="dark-button" to="/catalog">Explorar catálogo <ArrowRight/></Link></div>}
      </section>
      <aside className="space-brief">
        {!selectedItems.length ? <div className="space-general-inquiry"><p className="eyebrow">¿AÚN NO TIENES PIEZAS?</p><h2>Empecemos por<br/><em>lo que buscas.</em></h2><p>Cuéntanos qué necesitas y te ayudamos a empezar sin elegir un producto todavía.</p><Link to="/contact#contact-form">Enviar una consulta <ArrowRight/></Link></div> : proposalRoute === 'choose' ? <div className="proposal-paths"><p className="eyebrow">¿CÓMO QUIERES CONTINUAR?</p><h2>Tu selección<br/>ya está <em>lista.</em></h2><p>Solicita estas piezas tal como están o agrúpalas por ambiente para revisar medidas y presupuesto.</p><button className="proposal-path" type="button" onClick={() => chooseProposalRoute('direct')}><span><Check/></span><div><b>Solicitar estas piezas</b><small>Confirma disponibilidad, acabados y entrega.</small></div><ArrowRight/></button><button className="proposal-path" type="button" onClick={() => chooseProposalRoute('review')}><span><Ruler/></span><div><b>Revisar por ambientes</b><small>Cada grupo tiene sus propias medidas y presupuesto.</small></div><ArrowRight/></button><Link className="proposal-add-items" to="/catalog">Agregar otra pieza <ArrowRight/></Link></div> : <>
          <div className="proposal-route-head"><p className="eyebrow">{proposalRoute === 'review' ? 'ASESORÍA POR AMBIENTES' : 'SOLICITAR PIEZAS'}</p><h2>{proposalRoute === 'review' ? <>Hagamos que<br/><em>sí encaje.</em></> : <>Hablemos de tu<br/><em>selección.</em></>}</h2><p>{proposalRoute === 'review' ? 'Cada ambiente guarda sus propias piezas, medidas, presupuesto y observaciones.' : 'No necesitas medidas ni presupuesto. Solo confirma cómo podemos contactarte.'}</p><button className="proposal-change-route" type="button" onClick={() => { setProposalRoute('choose'); setSaveState('idle'); setSaveError(''); }}>Cambiar opción</button></div>
          {proposalRoute === 'review' && activeReviewGroup && <div className="room-planner"><div className="room-planner-intro"><p>Ya organizamos las piezas por ambiente. Solo revisa uno a la vez; si una pieza está en el ambiente equivocado, cámbialo a la izquierda.</p><small>Las medidas son del ambiente completo, no del mueble.</small></div><div className="room-stepper" aria-label="Ambientes de la propuesta">{activeGroups.map((group, index) => <button type="button" key={group.room.id} className={index === activeReviewIndex ? 'active' : ''} onClick={() => setReviewRoomIndex(index)}><span>{index + 1}</span><b>{group.label}</b><small>{group.items.length} {group.items.length === 1 ? 'pieza' : 'piezas'}</small></button>)}</div><section className="room-editor" key={activeReviewGroup.room.id}><div className="room-editor-head"><div><p className="eyebrow">PASO {activeReviewIndex + 1} DE {activeGroups.length}</p><h3>Revisemos tu {activeReviewGroup.label.toLowerCase()}.</h3></div></div><p className="room-editor-pieces">Aquí incluimos: <b>{activeReviewGroup.items.map((item) => item.product.name).join(', ')}</b>.</p><fieldset><legend><Ruler/> Medidas del ambiente <small>(opcionales)</small></legend><div className="measurements"><label>Ancho<input type="text" inputMode="decimal" value={activeReviewGroup.room.width} onChange={(event) => planner.updateRoom(activeReviewGroup.room.id, { width: onlyDecimal(event.target.value) })} placeholder="Ej. 4.2"/></label><span>×</span><label>Fondo<input type="text" inputMode="decimal" value={activeReviewGroup.room.depth} onChange={(event) => planner.updateRoom(activeReviewGroup.room.id, { depth: onlyDecimal(event.target.value) })} placeholder="Ej. 3.5"/></label></div></fieldset><fieldset><legend>Presupuesto para este ambiente <small>(opcional)</small></legend><label className="budget-input">$<input type="text" inputMode="numeric" value={activeReviewGroup.room.budget} onChange={(event) => planner.updateRoom(activeReviewGroup.room.id, { budget: onlyDigits(event.target.value, 9) })} placeholder="Ej. 2500"/></label></fieldset><label className="room-editor-note">Algo sobre este ambiente <small>(opcional)</small><textarea value={activeReviewGroup.room.notes} maxLength={500} onChange={(event) => planner.updateRoom(activeReviewGroup.room.id, { notes: event.target.value })} placeholder="Puertas, ventanas, fecha o distribución…"/></label>{roomFeedback(activeReviewGroup.estimate, activeReviewGroup.budgetValue, activeReviewGroup.total)}<div className="room-editor-navigation">{activeReviewIndex > 0 && <button type="button" onClick={() => setReviewRoomIndex(activeReviewIndex - 1)}>Anterior</button>}{activeReviewIndex + 1 < activeGroups.length && <button type="button" onClick={() => setReviewRoomIndex(activeReviewIndex + 1)}>Siguiente: {activeGroups[activeReviewIndex + 1].label} <ArrowRight/></button>}</div></section></div>}
          <div className="proposal-contact"><p className="eyebrow">{proposalRoute === 'review' ? 'RECIBE LA REVISIÓN POR AMBIENTES' : 'SOLICITA ESTAS PIEZAS'}</p><div className="proposal-fields"><label>Nombre<input value={contactName} onChange={(event) => setContactName(event.target.value)} autoComplete="name" minLength={2} maxLength={100} placeholder="Tu nombre"/></label><label>WhatsApp<input value={contactPhone} onChange={(event) => setContactPhone(onlyDigits(event.target.value, 10))} autoComplete="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="Ej. 0986951419"/></label><label>Correo <small>(opcional)</small><input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} autoComplete="email" inputMode="email" maxLength={254} placeholder="correo@ejemplo.com"/></label><label>Algo que debamos considerar <small>(opcional)</small><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} placeholder={proposalRoute === 'review' ? 'Necesidades generales para la propuesta…' : 'Color, acabados o fecha en la que te gustaría recibirlas…'}/></label><label className="legal-consent"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)}/><span>Autorizo el uso de mis datos según la <Link to="/privacy" target="_blank">Política de privacidad</Link>. Conozco los <Link to="/terms" target="_blank">Términos</Link>.</span></label><label className="proposal-honeypot" aria-hidden="true">Sitio web<input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off"/></label></div></div>
          {saveState === 'saved' ? <div className="proposal-success"><Check/><div><b>{proposalRoute === 'review' ? 'Tu solicitud de revisión quedó registrada.' : 'Tu solicitud quedó registrada.'}</b><span>Cuando quieras, abre WhatsApp para conversar con el showroom.</span></div></div> : <button className="dark-button full" type="button" onClick={saveProposal} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Guardando…' : proposalRoute === 'review' ? 'Guardar solicitud de revisión' : 'Guardar solicitud'} <ArrowRight/></button>}
          {saveState === 'saved' && <a className="dark-button full proposal-whatsapp" href={whatsappLink(message)} onClick={() => trackEvent('contact_whatsapp', { location: proposalRoute === 'review' ? 'space_review' : 'space_request', item_count: selectedItems.length, value: total, currency: 'USD' })} target="_blank" rel="noreferrer">{proposalRoute === 'review' ? 'Abrir WhatsApp con mi revisión' : 'Abrir WhatsApp para consultar'} <ArrowRight/></a>}
          {saveState === 'error' && <p className="proposal-error" role="alert">{saveError}</p>}
          <p className="space-note"><Clock3/> {proposalRoute === 'review' ? 'Te respondemos con disponibilidad, proporciones y una recomendación para cada ambiente.' : 'Te respondemos con disponibilidad, acabados y plazo de entrega.'}</p>
        </>}
      </aside>
    </div>
  </section>;
}
