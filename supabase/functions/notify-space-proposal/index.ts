type ProposalItem = {
  name?: string;
  category?: string;
  colorName?: string;
  price?: number;
};

type Proposal = {
  id?: string;
  created_at?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string | null;
  room_type?: string;
  room_width_cm?: number | null;
  room_depth_cm?: number | null;
  budget?: number | null;
  total_price?: number;
  required_area_sqm?: number | null;
  items?: ProposalItem[];
  notes?: string | null;
};

type DatabaseWebhook = { type?: string; table?: string; record?: Proposal };

const destination = Deno.env.get('NOTIFICATION_EMAIL');
const resendKey = Deno.env.get('RESEND_API_KEY');
const sender = Deno.env.get('RESEND_FROM') ?? 'Casa Nativa Demo <onboarding@resend.dev>';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]!);
}

function money(value?: number | null) {
  return value === null || value === undefined ? 'Por definir' : `$${Number(value).toLocaleString('en-US')}`;
}

function proposalEmail(proposal: Proposal) {
  const room = [proposal.room_width_cm, proposal.room_depth_cm].every((value) => typeof value === 'number')
    ? `${proposal.room_width_cm! / 100} m × ${proposal.room_depth_cm! / 100} m`
    : 'Por definir';
  const items = (proposal.items ?? []).map((item) => `<li><strong>${escapeHtml(item.name ?? 'Pieza')}</strong>${item.colorName ? ` · ${escapeHtml(item.colorName)}` : ''}<br><span>${escapeHtml(item.category ?? '')} · ${money(item.price)}</span></li>`).join('');
  const notes = proposal.notes ? `<p><strong>Notas:</strong><br>${escapeHtml(proposal.notes)}</p>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f3efe6;color:#20221e;font-family:Arial,sans-serif"><main style="max-width:620px;margin:0 auto;padding:32px"><p style="letter-spacing:2px;font-size:11px">NUEVA PROPUESTA · CASA NATIVA</p><h1 style="font-family:Georgia,serif;font-size:38px;font-weight:500;margin:10px 0 26px">${escapeHtml(proposal.contact_name ?? 'Nuevo visitante')} quiere asesoría.</h1><section style="background:#fffdf8;padding:24px;border:1px solid #ded5c6"><p><strong>WhatsApp:</strong> ${escapeHtml(proposal.contact_phone ?? 'No indicado')}</p><p><strong>Correo:</strong> ${escapeHtml(proposal.contact_email ?? 'No indicado')}</p><p><strong>Espacio:</strong> ${escapeHtml(proposal.room_type ?? 'Por definir')} · ${room}</p><p><strong>Presupuesto:</strong> ${money(proposal.budget)} · <strong>Total:</strong> ${money(proposal.total_price)}</p><p><strong>Área orientativa requerida:</strong> ${proposal.required_area_sqm ? `${proposal.required_area_sqm} m²` : 'Por calcular'}</p><hr style="border:0;border-top:1px solid #ded5c6;margin:24px 0"><strong>Piezas elegidas</strong><ul style="padding-left:18px;line-height:1.6">${items}</ul>${notes}</section><p style="font-size:12px;color:#6f695e">Propuesta ${escapeHtml(proposal.id ?? '')} · revisa y actualiza el estado en Supabase.</p></main></body></html>`;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!destination || !resendKey) return new Response('Notification secrets are not configured', { status: 503 });

  const event = await request.json() as DatabaseWebhook;
  if (event.type !== 'INSERT' || event.table !== 'space_proposals' || !event.record) return new Response('Ignored', { status: 200 });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: sender,
      to: [destination],
      subject: `Nueva propuesta · ${event.record.contact_name ?? 'Casa Nativa'}`,
      html: proposalEmail(event.record),
    }),
  });

  if (!response.ok) return new Response('Could not deliver the email notification', { status: 502 });
  return Response.json({ delivered: true });
});
