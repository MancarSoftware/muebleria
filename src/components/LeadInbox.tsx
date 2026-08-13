import { Check, ChevronRight, ClipboardList, LoaderCircle, Mail, MessageCircle, RefreshCw, Send, StickyNote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getLeadActivities, getLeads, updateLead, type Lead, type LeadActivity, type LeadStatus } from '../services/leads';

const statusLabels: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Propuesta en curso',
  closed: 'Cerrado',
  archived: 'Archivado',
};

const statusOptions = Object.entries(statusLabels) as Array<[LeadStatus, string]>;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

function whatsappForLead(lead: Lead) {
  const rawPhone = lead.contactPhone.replace(/\D/g, '');
  const phone = rawPhone.length === 10 && rawPhone.startsWith('0') ? `593${rawPhone.slice(1)}` : rawPhone;
  const pieces = lead.items.map((item) => `${item.name}${item.colorName ? ` (${item.colorName})` : ''}`).join(', ');
  return `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${lead.contactName}, soy de Casa Nativa. Revisé tu propuesta para ${lead.roomType.toLowerCase()} con ${pieces}. ¿Te parece si la vemos juntos?`)}`;
}

function activityDescription(activity: LeadActivity) {
  if (activity.activityType === 'note') return activity.note;
  return `Estado: ${statusLabels[activity.fromStatus ?? 'new']} → ${statusLabels[activity.toStatus ?? 'new']}`;
}

export function LeadInbox() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const visibleLeads = useMemo(() => filter === 'all' ? leads : leads.filter((lead) => lead.status === filter), [filter, leads]);
  const summary = useMemo(() => ({ total: leads.length, new: leads.filter((lead) => lead.status === 'new').length, active: leads.filter((lead) => lead.status === 'contacted' || lead.status === 'qualified').length, closed: leads.filter((lead) => lead.status === 'closed').length }), [leads]);

  const loadActivities = async (proposalId: string) => {
    try { setActivities(await getLeadActivities(proposalId)); } catch { setActivities([]); }
  };

  const loadLeads = async () => {
    setLoading(true); setMessage('');
    try {
      const nextLeads = await getLeads();
      setLeads(nextLeads);
      setSelectedId((current) => nextLeads.some((lead) => lead.id === current) ? current : nextLeads[0]?.id ?? null);
    } catch (error) {
      const detail = error as { code?: string; message?: string };
      setMessage(detail.code === '42703' || detail.code === '42P01' ? 'Activa la bandeja de solicitudes con la migración 202608120006 en Supabase.' : 'No pudimos cargar las solicitudes. Revisa los permisos de Supabase.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadLeads(); }, []);
  useEffect(() => { if (selectedId) { setNote(''); void loadActivities(selectedId); } else setActivities([]); }, [selectedId]);

  const saveLead = async (status: LeadStatus) => {
    if (!selected) return;
    setSaving(true); setMessage('');
    try {
      await updateLead(selected.id, status, note);
      setNote('');
      await Promise.all([loadLeads(), loadActivities(selected.id)]);
      setMessage('Seguimiento guardado.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No pudimos guardar el seguimiento.'); }
    finally { setSaving(false); }
  };

  return <section className="lead-inbox" id="solicitudes" aria-labelledby="lead-inbox-title">
    <header className="lead-inbox-head"><div><p className="eyebrow"><ClipboardList/> SOLICITUDES</p><h2 id="lead-inbox-title">Conversaciones que<br/><em>importan.</em></h2><p>Propuestas enviadas desde el sitio. Gestiona el seguimiento sin salir de tu catálogo.</p></div><div className="lead-summary"><span><b>{summary.total}</b> solicitudes</span><span><b>{summary.new}</b> nuevas</span><span><b>{summary.active}</b> en curso</span><span><b>{summary.closed}</b> cerradas</span></div></header>
    <div className="lead-toolbar"><label>Ver<select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | LeadStatus)}><option value="all">Todas las solicitudes</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" onClick={() => void loadLeads()} disabled={loading}><RefreshCw className={loading ? 'spin' : ''}/> Actualizar</button></div>
    {message && <p className={`lead-notice ${message.startsWith('Seguimiento') ? 'success' : ''}`}>{message}</p>}
    {loading && !leads.length ? <div className="lead-loading"><LoaderCircle className="spin"/> Cargando solicitudes…</div> : <div className="lead-layout">
      <aside className="lead-list" aria-label="Lista de solicitudes">
        {visibleLeads.length ? visibleLeads.map((lead) => <button type="button" key={lead.id} className={lead.id === selected?.id ? 'selected' : ''} onClick={() => setSelectedId(lead.id)}><span className={`lead-status ${lead.status}`}>{statusLabels[lead.status]}</span><b>{lead.contactName}</b><small>{lead.roomType} · {lead.items.length} {lead.items.length === 1 ? 'pieza' : 'piezas'}</small><time>{dateTime.format(new Date(lead.updatedAt))}</time><ChevronRight/></button>) : <div className="lead-empty"><ClipboardList/><b>No hay solicitudes aquí.</b><span>Cuando alguien guarde una propuesta, aparecerá en esta lista.</span></div>}
      </aside>
      {selected ? <article className="lead-detail">
        <header><div><span className={`lead-status ${selected.status}`}>{statusLabels[selected.status]}</span><h3>{selected.contactName}</h3><time>Recibida {dateTime.format(new Date(selected.createdAt))}</time></div><select value={selected.status} onChange={(event) => void saveLead(event.target.value as LeadStatus)} disabled={saving}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></header>
        <div className="lead-contact-actions"><a href={whatsappForLead(selected)} target="_blank" rel="noreferrer"><MessageCircle/> Escribir por WhatsApp</a>{selected.contactEmail && <a href={`mailto:${selected.contactEmail}?subject=${encodeURIComponent('Tu propuesta Casa Nativa')}`}><Mail/> Enviar correo</a>}</div>
        <dl className="lead-facts"><div><dt>Espacio</dt><dd>{selected.roomType}</dd></div><div><dt>Medidas</dt><dd>{selected.roomWidthCm && selected.roomDepthCm ? `${selected.roomWidthCm} × ${selected.roomDepthCm} cm` : 'Por confirmar'}</dd></div><div><dt>Presupuesto</dt><dd>{selected.budget ? money.format(selected.budget) : 'Por definir'}</dd></div><div><dt>Selección</dt><dd>{money.format(selected.totalPrice)}</dd></div></dl>
        <section className="lead-pieces"><p className="eyebrow">PIEZAS SOLICITADAS</p>{selected.items.map((item) => <div key={item.productId}><span><b>{item.name}</b>{item.colorName && <small>{item.colorName}</small>}</span><span>{money.format(item.price)}</span></div>)}</section>
        {selected.notes && <section className="lead-client-note"><p className="eyebrow">NOTA DEL CLIENTE</p><p>{selected.notes}</p></section>}
        <section className="lead-followup"><p className="eyebrow"><StickyNote/> SEGUIMIENTO PRIVADO</p><textarea value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Ej. Hablamos por WhatsApp; enviar alternativa en madera clara."/><button type="button" className="dark-button" onClick={() => void saveLead(selected.status)} disabled={saving}>{saving ? <LoaderCircle className="spin"/> : <><Send/> Guardar seguimiento</>}</button></section>
        <section className="lead-history"><p className="eyebrow">HISTORIAL</p>{activities.length ? activities.map((activity) => <div key={activity.id}><Check/><span>{activityDescription(activity)}</span><time>{dateTime.format(new Date(activity.createdAt))}</time></div>) : <span>No hay seguimientos todavía.</span>}</section>
      </article> : <div className="lead-detail lead-detail-empty"><ClipboardList/><h3>Elige una solicitud</h3><p>Selecciona una conversación para revisar la propuesta y continuar el seguimiento.</p></div>}
    </div>}
  </section>;
}
