export const business = {
  name:'Casa Nativa', tagline:'Muebles que dejan espacio para vivir.', whatsapp:'593999000000', phone:'+593 99 900 0000', email:'hola@casanativa.ec',
  address:'Av. Portugal N35-79, Quito, Ecuador', hours:'Lun–Sáb · 10:00–19:00', mapsUrl:'https://maps.google.com/?q=Av.+Portugal+N35-79,+Quito,+Ecuador', mapsEmbedUrl:'https://www.google.com/maps?q=Av.+Portugal+N35-79,+Quito,+Ecuador&z=16&output=embed', responseTime:'Te respondemos en un día hábil.',
  socials:{instagram:'#',facebook:'#',tiktok:'#'}
};
export const whatsappLink=(message:string)=>`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
