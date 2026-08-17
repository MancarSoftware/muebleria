type ProposalItem = { productId?: unknown; colorName?: unknown };
type ProposalSpace = {
  roomType?: unknown; roomWidthCm?: unknown; roomDepthCm?: unknown; budget?: unknown;
  requiredAreaSqm?: unknown; furnitureFootprintSqm?: unknown; notes?: unknown; items?: ProposalItem[];
};
type Proposal = {
  roomType?: unknown; roomWidthCm?: unknown; roomDepthCm?: unknown; budget?: unknown;
  totalPrice?: unknown; requiredAreaSqm?: unknown; furnitureFootprintSqm?: unknown;
  spaces?: ProposalSpace[]; items?: ProposalItem[]; contactName?: unknown; contactPhone?: unknown; contactEmail?: unknown; notes?: unknown; website?: unknown; privacyAccepted?: unknown;
};
type Request = { method?: string; body?: Proposal };
type Response = { status: (statusCode: number) => { json: (body: unknown) => void } };

const text = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') return response.status(405).json({ message: 'Method not allowed.' });
  const proposal = request.body;
  const name = text(proposal?.contactName, 100);
  const phone = text(proposal?.contactPhone, 10);
  const items = Array.isArray(proposal?.items) ? proposal.items.slice(0, 20) : [];
  const spaces = Array.isArray(proposal?.spaces) ? proposal.spaces.slice(0, 10) : [];
  if (text(proposal?.website)) return response.status(204).json({ id: 'ignored' });
  const productIds = items.map((item) => text(item.productId, 100));
  if (name.length < 2 || !/^\d{10}$/.test(phone) || proposal?.privacyAccepted !== true || !items.length || new Set(productIds).size !== items.length || !productIds.every(isUuid)) {
    return response.status(400).json({ message: 'Acepta la Política de privacidad, completa un WhatsApp ecuatoriano de 10 números y selecciona una pieza.' });
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return response.status(503).json({ message: 'Lead storage is not configured.' });

  try {
    const result = await fetch(`${url}/rest/v1/rpc/submit_space_proposal_with_consent`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_room_type: text(proposal?.roomType, 40),
        p_room_width_cm: typeof proposal?.roomWidthCm === 'number' ? proposal.roomWidthCm : null,
        p_room_depth_cm: typeof proposal?.roomDepthCm === 'number' ? proposal.roomDepthCm : null,
        p_budget: typeof proposal?.budget === 'number' ? proposal.budget : null,
        p_required_area_sqm: typeof proposal?.requiredAreaSqm === 'number' ? proposal.requiredAreaSqm : null,
        p_furniture_footprint_sqm: typeof proposal?.furnitureFootprintSqm === 'number' ? proposal.furnitureFootprintSqm : null,
        p_spaces: spaces.map((space) => ({
          room_type: text(space.roomType, 40),
          room_width_cm: typeof space.roomWidthCm === 'number' ? space.roomWidthCm : null,
          room_depth_cm: typeof space.roomDepthCm === 'number' ? space.roomDepthCm : null,
          budget: typeof space.budget === 'number' ? space.budget : null,
          required_area_sqm: typeof space.requiredAreaSqm === 'number' ? space.requiredAreaSqm : null,
          furniture_footprint_sqm: typeof space.furnitureFootprintSqm === 'number' ? space.furnitureFootprintSqm : null,
          notes: text(space.notes, 500) || null,
          items: (Array.isArray(space.items) ? space.items.slice(0, 20) : []).map((item) => ({ product_id: text(item.productId, 100), color_name: text(item.colorName, 80) || null })),
        })),
        p_items: items.map((item) => ({ product_id: text(item.productId, 100), color_name: text(item.colorName, 80) || null })),
        p_contact_name: name,
        p_contact_phone: phone,
        p_contact_email: text(proposal?.contactEmail, 254),
        p_notes: text(proposal?.notes, 2_000),
        p_privacy_policy_version: '2026-08-13',
      }),
    });
    if (!result.ok) return response.status(502).json({ message: 'No pudimos registrar la propuesta.' });
    return response.status(201).json({ id: await result.json() as string });
  } catch {
    return response.status(502).json({ message: 'No pudimos registrar la propuesta.' });
  }
}
