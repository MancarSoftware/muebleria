import { Check, ChevronLeft, ChevronRight, ClipboardList, LoaderCircle, Mail, MessageCircle, RefreshCw, Send, StickyNote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getLeads, updateLead, type Lead, type LeadStatus } from '../services/leads';

const statusLabels: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Propuesta en curso',
  closed: 'Cerrado',
  archived: 'Archivado',
};

const statusOptions = Object.entries(statusLabels) as Array<[LeadStatus, string]>;
type LeadFilter = 'all' | LeadStatus;
const pageSize = 7;

const filterLabels: Record<LeadFilter, string> = {
  new: 'Nuevas',
  contacted: 'Contactadas',
  qualified: 'Propuestas en curso',
  closed: 'Cerradas',
  archived: 'Archivadas',
  all: 'Todas las solicitudes',
};
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

function matchesFilter(lead: Lead, filter: LeadFilter) {
  return filter === 'all' || lead.status === filter;
}

function pageFor(leads: Lead[], filter: LeadFilter, requestedPage: number) {
  const items = leads.filter((lead) => matchesFilter(lead, filter));
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(requestedPage, 0), totalPages - 1);
  return { items: items.slice(page * pageSize, (page + 1) * pageSize), page, totalPages, total: items.length };
}

function whatsappForLead(lead: Lead) {
  const rawPhone = lead.contactPhone.replace(/\D/g, '');
  const phone = rawPhone.length === 10 && rawPhone.startsWith('0') ? `593${rawPhone.slice(1)}` : rawPhone;
  const pieces = lead.items.map((item) => `${item.name}${item.colorName ? ` (${item.colorName})` : ''}`).join(', ');
  const context = lead.source === 'contact_form'
    ? `tu consulta para ${lead.roomType.toLowerCase()}`
    : `tu propuesta para ${lead.roomType.toLowerCase()} con ${pieces}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${lead.contactName}, soy de Casa Nativa. Revisé ${context}. ¿Te parece si la vemos juntos?`)}`;
}

function leadSummary(lead: Lead) {
  return lead.source === 'contact_form'
    ? `Consulta de contacto · ${lead.roomType}`
    : `${lead.roomType} · ${lead.items.length} ${lead.items.length === 1 ? 'pieza' : 'piezas'}`;
}

export function LeadInbox() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeadFilter>('new');
  const [pageByFilter, setPageByFilter] = useState<Record<LeadFilter, number>>({ all: 0, new: 0, contacted: 0, qualified: 0, closed: 0, archived: 0 });
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveConfirmation, setSaveConfirmation] = useState('');

  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const leadPage = useMemo(() => pageFor(leads, filter, pageByFilter[filter]), [filter, leads, pageByFilter]);
  const summary = useMemo(() => ({ total: leads.length, new: leads.filter((lead) => lead.status === 'new').length, active: leads.filter((lead) => lead.status === 'contacted' || lead.status === 'qualified').length, closed: leads.filter((lead) => lead.status === 'closed').length }), [leads]);

  const loadLeads = async () => {
    setLoading(true); setError('');
    try {
      const nextLeads = await getLeads();
      setLeads(nextLeads);
      const nextPage = pageFor(nextLeads, filter, pageByFilter[filter]);
      setPageByFilter((current) => ({ ...current, [filter]: nextPage.page }));
      setSelectedId((current) => {
        const currentLead = nextLeads.find((lead) => lead.id === current);
        return currentLead && nextPage.items.some((lead) => lead.id === currentLead.id) ? currentLead.id : nextPage.items[0]?.id ?? null;
      });
    } catch (error) {
      const detail = error as { code?: string; message?: string };
      setError(detail.code === '42703' || detail.code === '42P01' ? 'Activa la bandeja de solicitudes con la migración 202608120006 en Supabase.' : 'No pudimos cargar las solicitudes. Revisa los permisos de Supabase.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadLeads(); }, []);
  useEffect(() => { setNote(''); }, [selectedId]);

  const changeFilter = (nextFilter: LeadFilter) => {
    setFilter(nextFilter);
    const nextPage = pageFor(leads, nextFilter, pageByFilter[nextFilter]);
    setPageByFilter((current) => ({ ...current, [nextFilter]: nextPage.page }));
    setSelectedId(nextPage.items[0]?.id ?? null);
    setSaveConfirmation('');
  };

  const changePage = (nextPageNumber: number) => {
    const nextPage = pageFor(leads, filter, nextPageNumber);
    setPageByFilter((current) => ({ ...current, [filter]: nextPage.page }));
    setSelectedId(nextPage.items[0]?.id ?? null);
    setSaveConfirmation('');
  };

  const saveLead = async (status: LeadStatus) => {
    if (!selected) return;
    setSaving(true); setError(''); setSaveConfirmation('');
    try {
      await updateLead(selected.id, status, note);
      setNote('');
      const nextLeads = leads.map((lead) => lead.id === selected.id ? { ...lead, status, updatedAt: new Date().toISOString() } : lead);
      setLeads(nextLeads);
      const nextPage = pageFor(nextLeads, filter, pageByFilter[filter]);
      setPageByFilter((current) => ({ ...current, [filter]: nextPage.page }));
      if (filter !== 'all' && filter !== status) {
        setSelectedId(nextPage.items[0]?.id ?? null);
      } else {
        setSaveConfirmation('Seguimiento guardado.');
      }
    } catch (error) { setError(error instanceof Error ? error.message : 'No pudimos guardar el seguimiento.'); }
    finally { setSaving(false); }
  };

  return <section className="lead-inbox" id="solicitudes" aria-labelledby="lead-inbox-title">
    <header className="lead-inbox-head"><div><p className="eyebrow"><ClipboardList/> SOLICITUDES</p><h2 id="lead-inbox-title">Conversaciones que<br/><em>importan.</em></h2><p>Propuestas enviadas desde el sitio. Gestiona el seguimiento sin salir de tu catálogo.</p></div><div className="lead-summary"><span><b>{summary.total}</b> solicitudes</span><span><b>{summary.new}</b> nuevas</span><span><b>{summary.active}</b> en curso</span><span><b>{summary.closed}</b> cerradas</span></div></header>
    <div className="lead-toolbar"><label>Ver<select value={filter} onChange={(event) => changeFilter(event.target.value as LeadFilter)}>{(Object.keys(filterLabels) as LeadFilter[]).map((value) => <option key={value} value={value}>{filterLabels[value]}{value === 'new' ? ` (${summary.new})` : ''}</option>)}</select></label><button type="button" onClick={() => void loadLeads()} disabled={loading}><RefreshCw className={loading ? 'spin' : ''}/> Actualizar</button></div>
    {error && <p className="lead-notice">{error}</p>}
    {loading && !leads.length ? <div className="lead-loading"><LoaderCircle className="spin"/> Cargando solicitudes…</div> : <div className="lead-layout">
      <aside className="lead-list" aria-label="Lista de solicitudes">
        {leadPage.total ? <>{leadPage.items.map((lead) => <button type="button" key={lead.id} className={lead.id === selected?.id ? 'selected' : ''} onClick={() => setSelectedId(lead.id)}><span className={`lead-status ${lead.status}`}>{statusLabels[lead.status]}</span><b>{lead.contactName}</b><small>{leadSummary(lead)}</small><time>{dateTime.format(new Date(lead.updatedAt))}</time><ChevronRight/></button>)}{leadPage.totalPages > 1 && <nav className="lead-pagination" aria-label="Paginación de solicitudes"><button type="button" onClick={() => changePage(leadPage.page - 1)} disabled={leadPage.page === 0}><ChevronLeft/> Anterior</button><span>Página {leadPage.page + 1} de {leadPage.totalPages}</span><button type="button" onClick={() => changePage(leadPage.page + 1)} disabled={leadPage.page + 1 === leadPage.totalPages}>Siguiente <ChevronRight/></button></nav>}</> : <div className="lead-empty"><ClipboardList/><b>No hay solicitudes {filterLabels[filter].toLowerCase()}.</b><span>Cuando haya una propuesta en esta etapa, aparecerá en esta lista.</span></div>}
      </aside>
      {selected ? <article className="lead-detail">
        <header><div><span className={`lead-status ${selected.status}`}>{statusLabels[selected.status]}</span><h3>{selected.contactName}</h3><time>Recibida {dateTime.format(new Date(selected.createdAt))}</time></div><select value={selected.status} onChange={(event) => void saveLead(event.target.value as LeadStatus)} disabled={saving}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></header>
        <div className="lead-contact-actions"><a href={whatsappForLead(selected)} target="_blank" rel="noreferrer"><MessageCircle/> Escribir por WhatsApp</a>{selected.contactEmail && <a href={`mailto:${selected.contactEmail}?subject=${encodeURIComponent('Tu propuesta Casa Nativa')}`}><Mail/> Enviar correo</a>}</div>
        <dl className="lead-facts"><div><dt>Espacio</dt><dd>{selected.roomType}</dd></div><div><dt>Medidas</dt><dd>{selected.roomWidthCm && selected.roomDepthCm ? `${selected.roomWidthCm} × ${selected.roomDepthCm} cm` : 'Por confirmar'}</dd></div><div><dt>Presupuesto</dt><dd>{selected.budget ? money.format(selected.budget) : 'Por definir'}</dd></div><div><dt>{selected.source === 'contact_form' ? 'Solicitud' : 'Selección'}</dt><dd>{selected.source === 'contact_form' ? 'Consulta directa' : money.format(selected.totalPrice)}</dd></div></dl>
        {selected.items.length > 0 && <section className="lead-pieces"><p className="eyebrow">PIEZAS SOLICITADAS</p>{selected.items.map((item) => <div key={item.productId}><span><b>{item.name}</b>{item.colorName && <small>{item.colorName}</small>}</span><span>{money.format(item.price)}</span></div>)}</section>}
        {selected.notes && <section className="lead-client-note"><p className="eyebrow">{selected.source === 'contact_form' ? 'MENSAJE DEL CLIENTE' : 'NOTA DEL CLIENTE'}</p><p>{selected.notes}</p></section>}
        <section className="lead-followup"><p className="eyebrow"><StickyNote/> SEGUIMIENTO PRIVADO</p><textarea value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Ej. Hablamos por WhatsApp; enviar alternativa en madera clara."/><button type="button" className="dark-button" onClick={() => void saveLead(selected.status)} disabled={saving}>{saving ? <LoaderCircle className="spin"/> : <><Send/> Guardar seguimiento</>}</button>{saveConfirmation && <p className="lead-save-confirmation" role="status"><Check/> {saveConfirmation}</p>}</section>
      </article> : <div className="lead-detail lead-detail-empty"><ClipboardList/><h3>Elige una solicitud</h3><p>Selecciona una conversación para revisar la propuesta y continuar el seguimiento.</p></div>}
    </div>}
  </section>;
}
