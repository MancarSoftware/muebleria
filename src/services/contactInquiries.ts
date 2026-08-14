import { isComEmail, isValidPhone } from '../lib/formValidation';
import { supabase } from '../lib/supabase';
import { legal } from '../config/legal';

export type ContactInquiryInput = {
  name: string;
  email: string;
  phone: string;
  roomType: string;
  message: string;
  privacyAccepted: boolean;
};

export async function saveContactInquiry(input: ContactInquiryInput) {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const message = input.message.trim();

  if (name.length < 2 || !isValidPhone(phone) || !isComEmail(email) || input.roomType.trim().length < 2 || message.length < 8) {
    throw new Error('Revisa los datos: usa un WhatsApp ecuatoriano de 10 números y un correo con @ y .com.');
  }
  if (!input.privacyAccepted) throw new Error('Debes aceptar la Política de privacidad para enviar la consulta.');
  if (!supabase) throw new Error('El registro de consultas aún no está configurado.');

  const { data, error } = await supabase.rpc('submit_contact_inquiry_with_consent', {
    p_room_type: input.roomType.trim(),
    p_contact_name: name,
    p_contact_phone: phone,
    p_contact_email: email,
    p_notes: message,
    p_privacy_policy_version: legal.policyVersion,
  });
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') {
      throw new Error('Falta activar el registro de consultas. Ejecuta la migración 202608120009 en Supabase.');
    }
    throw new Error(error.message);
  }
  return { id: data as string };
}
