export const business = {
  name: 'Casa Nativa',
  tagline: 'Muebles que dejan espacio para vivir.',
  // WhatsApp uses Ecuador's country code and omits the initial local zero.
  whatsapp: '593986951419',
  phone: '0986951419',
  email: 'alemancar0511@gmail.com',
  address: 'Av. Portugal N35-79, Quito, Ecuador',
  hours: 'Lun–Sáb · 10:00–19:00',
  mapsUrl: 'https://maps.google.com/?q=Av.+Portugal+N35-79,+Quito,+Ecuador',
};

export const whatsappLink = (message: string) => `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
