import { supabase } from '../lib/supabase';
import type { SpaceProposalItem } from './spaceProposals';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'archived';

export type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: LeadStatus;
  roomType: string;
  roomWidthCm: number | null;
  roomDepthCm: number | null;
  budget: number | null;
  totalPrice: number;
  requiredAreaSqm: number | null;
  furnitureFootprintSqm: number | null;
  items: SpaceProposalItem[];
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  notes: string | null;
};

export type LeadActivity = {
  id: string;
  createdAt: string;
  activityType: 'status_change' | 'note';
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus | null;
  note: string | null;
};

type LeadRow = {
  id: string; created_at: string; updated_at: string; status: LeadStatus; room_type: string;
  room_width_cm: number | null; room_depth_cm: number | null; budget: number | null; total_price: number;
  required_area_sqm: number | null; furniture_footprint_sqm: number | null; items: SpaceProposalItem[];
  contact_name: string; contact_phone: string; contact_email: string | null; notes: string | null;
};

type LeadActivityRow = { id: string; created_at: string; activity_type: 'status_change' | 'note'; from_status: LeadStatus | null; to_status: LeadStatus | null; note: string | null };

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id, createdAt: row.created_at, updatedAt: row.updated_at, status: row.status, roomType: row.room_type,
    roomWidthCm: row.room_width_cm === null ? null : Number(row.room_width_cm), roomDepthCm: row.room_depth_cm === null ? null : Number(row.room_depth_cm), budget: row.budget === null ? null : Number(row.budget), totalPrice: Number(row.total_price), requiredAreaSqm: row.required_area_sqm === null ? null : Number(row.required_area_sqm), furnitureFootprintSqm: row.furniture_footprint_sqm === null ? null : Number(row.furniture_footprint_sqm), items: row.items ?? [], contactName: row.contact_name, contactPhone: row.contact_phone, contactEmail: row.contact_email, notes: row.notes,
  };
}

export async function getLeads(): Promise<Lead[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('space_proposals').select('id, created_at, updated_at, status, room_type, room_width_cm, room_depth_cm, budget, total_price, required_area_sqm, furniture_footprint_sqm, items, contact_name, contact_phone, contact_email, notes').order('updated_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data as LeadRow[]).map(mapLead);
}

export async function getLeadActivities(proposalId: string): Promise<LeadActivity[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('space_proposal_activities').select('id, created_at, activity_type, from_status, to_status, note').eq('proposal_id', proposalId).order('created_at', { ascending: false }).limit(30);
  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data as LeadActivityRow[]).map((row) => ({ id: row.id, createdAt: row.created_at, activityType: row.activity_type, fromStatus: row.from_status, toStatus: row.to_status, note: row.note }));
}

export async function updateLead(proposalId: string, status: LeadStatus, note?: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.rpc('update_space_proposal_lead', { p_proposal_id: proposalId, p_status: status, p_note: note?.trim() || null });
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') throw new Error('Falta activar la bandeja de solicitudes. Ejecuta la migración 202608120006 en Supabase.');
    throw error;
  }
}
