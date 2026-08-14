import { isComEmail, isValidPhone } from '../lib/formValidation';
import { supabase } from '../lib/supabase';

export type SpaceProposalItem = {
  productId: string;
  slug: string;
  name: string;
  category: string;
  colorName?: string;
  price: number;
  dimensions: string;
};

export type SpaceProposalInput = {
  roomType: string;
  roomWidthCm?: number | null;
  roomDepthCm?: number | null;
  budget?: number | null;
  totalPrice: number;
  requiredAreaSqm?: number | null;
  furnitureFootprintSqm?: number | null;
  items: SpaceProposalItem[];
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  notes?: string;
  website?: string;
};

type SaveResult = { id: string };

function rpcPayload(input: SpaceProposalInput) {
  return {
    p_room_type: input.roomType,
    p_room_width_cm: input.roomWidthCm ?? null,
    p_room_depth_cm: input.roomDepthCm ?? null,
    p_budget: input.budget ?? null,
    p_required_area_sqm: input.requiredAreaSqm ?? null,
    p_furniture_footprint_sqm: input.furnitureFootprintSqm ?? null,
    p_items: input.items.map((item) => ({ product_id: item.productId, color_name: item.colorName ?? null })),
    p_contact_name: input.contactName.trim(),
    p_contact_phone: input.contactPhone.trim(),
    p_contact_email: input.contactEmail?.trim() || '',
    p_notes: input.notes?.trim() || '',
  };
}

export async function saveSpaceProposal(input: SpaceProposalInput): Promise<SaveResult> {
  if (input.website) throw new Error('No se pudo registrar la propuesta.');
  if (!input.items.length || input.contactName.trim().length < 2 || !isValidPhone(input.contactPhone.trim())) {
    throw new Error('Completa tu nombre y un WhatsApp ecuatoriano de 10 números.');
  }
  if (input.contactEmail?.trim() && !isComEmail(input.contactEmail)) {
    throw new Error('Escribe un correo válido que incluya @ y .com.');
  }

  if (import.meta.env.VITE_ROUTER_MODE !== 'hash') {
    try {
      const response = await fetch('/api/space-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const body = isJson ? await response.json() as { id?: string; message?: string } : null;
      if (response.ok && body?.id) return { id: body.id };
      // Vite does not host serverless routes. The database function validates the
      // same catalog data locally, and GitHub Pages deliberately uses it directly.
      if (response.status !== 404 && response.status !== 503 && isJson) throw new Error(body?.message || 'No pudimos guardar la propuesta.');
    } catch (error) {
      if (error instanceof Error && !/Unexpected token|No pudimos guardar/.test(error.message)) throw error;
    }
  }

  if (!supabase) throw new Error('El registro de propuestas aún no está configurado.');
  const { data, error } = await supabase.rpc('submit_space_proposal', rpcPayload(input));
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') throw new Error('Falta activar el registro de propuestas. Ejecuta la migración 202608120003 en Supabase.');
    throw new Error(error.message);
  }
  return { id: data as string };
}
