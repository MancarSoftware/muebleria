import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowRight, Check, Clock3, Mail, MapPin, Menu, MessageCircle, Phone, Sparkles, X } from 'lucide-react';
import heroImage from '../assets/hero-showroom.webp';
import sofaImage from '../assets/products/sofa-olmo-editorial.webp';
import tableImage from '../assets/products/mesa-aura-editorial.webp';
import bedImage from '../assets/products/cama-luna-editorial.webp';
import chairImage from '../assets/products/silla-cedro-editorial.webp';
import { business, whatsappLink } from '../config/business';
import { trackEvent } from '../lib/analytics';

const navigation = [['La propuesta', '#propuesta'], ['Piezas', '#piezas'], ['Visítanos', '#visita'], ['Contacto', '#contacto']];
const steps = [
  ['01', 'Cuéntanos tu espacio', 'Tus ideas, medidas o incluso una foto. Empezamos desde donde estés.'],
  ['02', 'Probamos posibilidades', 'Vemos materiales y proporciones para que puedas decidir con claridad.'],
  ['03', 'Eliges con certeza', 'Visita el showroom y conoce las piezas antes de llevarlas a casa.'],
];
const pieces = [
  { image: sofaImage, title: 'Sofá Olmo', category: 'Para salas que invitan a quedarse' },
  { image: tableImage, title: 'Mesa Aura', category: 'Para comidas que se alargan' },
  { image: bedImage, title: 'Cama Luna', category: 'Para bajar el ritmo' },
  { image: chairImage, title: 'Silla Cedro', category: 'Para los pequeños detalles' },
];

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitInquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    const space = String(form.get('space') ?? '').trim();
    const details = String(form.get('details') ?? '').trim();
    const message = `Hola, soy ${name}. Quiero conversar sobre ${space || 'mi espacio'}${phone ? `. Mi teléfono es ${phone}` : ''}${details ? `. ${details}` : ''}`;
    trackEvent('contact_whatsapp', { location: 'landing_form', room_type: space || undefined });
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return <div className="landing-site">
    <header className="landing-nav">
      <a className="landing-brand" href="#inicio" aria-label={`Ir al inicio de ${business.name}`}><span>CN</span>{business.name}</a>
      <nav aria-label="Navegación principal">{navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <a className="landing-nav-cta" href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => trackEvent('contact_whatsapp', { location: 'landing_header' })} target="_blank" rel="noreferrer"><MessageCircle/> Escribirnos</a>
      <button className="landing-menu-toggle" type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    {menuOpen && <motion.nav className="landing-mobile-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} aria-label="Navegación móvil">{navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowRight/></a>)}<a className="landing-menu-whatsapp" href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => { trackEvent('contact_whatsapp', { location: 'landing_mobile_menu' }); setMenuOpen(false); }} target="_blank" rel="noreferrer">Hablar por WhatsApp <ArrowRight/></a></motion.nav>}

    <main>
      <section className="sales-hero" id="inicio">
        <div className="sales-hero-copy">
          <motion.p className="sales-eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>MUEBLES Y ASESORÍA · QUITO</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .06 }}>Tu casa puede<br/><em>sentirse mejor.</em></motion.h1>
          <motion.p className="sales-hero-lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .14 }}>Piezas con presencia y una asesoría cercana para transformar cómo vives cada día.</motion.p>
          <motion.div className="sales-hero-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22 }}><a className="sales-button" href="#contacto">Quiero asesoría <ArrowRight/></a><a className="sales-link" href="#piezas">Conocer las piezas <ArrowDownRight/></a></motion.div>
          <div className="sales-hero-note"><Sparkles/><span>Sin presión, sin fórmulas.<br/><b>Solo decisiones que funcionan contigo.</b></span></div>
        </div>
        <motion.div className="sales-hero-media" initial={{ opacity: 0, scale: .985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .08 }}><img src={heroImage} alt="Interior cálido de Casa Nativa"/><div className="sales-hero-media-note"><span>SHOWROOM CASA NATIVA</span><b>Ven a sentir<br/>la diferencia.</b></div></motion.div>
      </section>

      <section className="sales-proof" id="propuesta"><p>UNA CASA BIEN ELEGIDA CAMBIA CÓMO SE VIVE.</p><div><span>Materiales reales</span><span>Escala que funciona</span><span>Atención personal</span></div></section>

      <section className="sales-intro"><div className="sales-intro-card"><span>CASA NATIVA</span><p>Elegir muebles no debería ser complicado.</p></div><div className="sales-intro-copy"><p className="sales-eyebrow">UNA MEJOR FORMA DE ELEGIR</p><h2>No necesitas saber de diseño.<br/>Necesitas sentir que <em>todo encaja.</em></h2><p>Te acompañamos a encontrar piezas que respondan a tu espacio, tu rutina y tu forma de habitar; no a una tendencia pasajera.</p><a className="sales-text-cta" href="#contacto">Cuéntanos qué imaginas <ArrowRight/></a></div></section>

      <section className="sales-process" id="servicios"><div className="sales-section-heading"><p className="sales-eyebrow">ASÍ EMPEZAMOS</p><h2>Te ayudamos a pasar de una idea a un espacio que se <em>siente tuyo.</em></h2></div><div className="sales-step-grid">{steps.map(([number, title, description], index) => <motion.article key={number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .45, delay: index * .08 }}><span>{number}</span><h3>{title}</h3><p>{description}</p><ArrowRight/></motion.article>)}</div></section>

      <section className="sales-pieces" id="piezas"><div className="sales-section-heading"><p className="sales-eyebrow">PIEZAS PARA LA VIDA REAL</p><h2>Encuentra la que hace que un espacio <em>cobre sentido.</em></h2></div><div className="sales-piece-grid">{pieces.map((piece, index) => <motion.figure key={piece.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .45, delay: index * .06 }}><div><img src={piece.image} alt={piece.title}/><span>0{index + 1}</span></div><figcaption><small>{piece.category}</small><strong>{piece.title}</strong></figcaption></motion.figure>)}</div><a className="sales-button sales-button-dark" href="#contacto">Quiero ver opciones <ArrowRight/></a></section>

      <section className="sales-visit" id="visita"><div className="sales-visit-image"><img src={tableImage} alt="Mesa de comedor de Casa Nativa"/></div><div className="sales-visit-copy"><p className="sales-eyebrow">VISITA EL SHOWROOM</p><h2>Las piezas se entienden con las manos, no solo con una <em>pantalla.</em></h2><p>Siéntate, toca los acabados y compara escalas. Estamos para ayudarte a elegir sin prisa.</p><div className="sales-visit-details"><a href={business.mapsUrl} target="_blank" rel="noreferrer"><MapPin/>{business.address}</a><span><Clock3/>{business.hours}</span></div><a className="sales-link-dark" href={business.mapsUrl} target="_blank" rel="noreferrer">Abrir ubicación <ArrowRight/></a></div></section>

      <section className="sales-contact" id="contacto"><div className="sales-contact-copy"><p className="sales-eyebrow">HABLEMOS DE TU ESPACIO</p><h2>Empieza por contarnos qué quieres <em>sentir.</em></h2><p>Una sala más tranquila, un comedor que reúna, un dormitorio que sí te haga descansar. Todo comienza con una conversación.</p><div><a href={`tel:${business.phone}`}><Phone/>{business.phone}</a><a href={`mailto:${business.email}`}><Mail/>{business.email}</a></div></div><form className="sales-form" onSubmit={submitInquiry}><div className="sales-form-heading"><span>01</span><p>Cuéntanos tu idea.</p></div><label>Tu nombre<input name="name" required autoComplete="name" placeholder="Cómo te llamas"/></label><label>Tu WhatsApp<input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Ingresa un teléfono ecuatoriano de 10 dígitos" placeholder="0986951419"/></label><label>¿Qué espacio quieres mejorar?<select name="space" defaultValue=""><option value="" disabled>Elige una opción</option><option>Sala</option><option>Comedor</option><option>Dormitorio</option><option>Oficina</option><option>Todo mi espacio</option></select></label><label>Cuéntanos un poco más<textarea name="details" placeholder="Qué necesitas, qué medidas tienes o qué te gustaría conseguir…"/></label><button className="sales-button" type="submit">Enviar por WhatsApp <ArrowRight/></button>{submitted && <p className="sales-form-success"><Check/> Abrimos WhatsApp con tu mensaje preparado.</p>}</form></section>
    </main>

    <footer className="sales-footer"><a className="landing-brand" href="#inicio"><span>CN</span>{business.name}</a><p>Diseñamos decisiones para habitar <em>mejor.</em></p><div><span>Quito, Ecuador</span><a href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => trackEvent('contact_whatsapp', { location: 'landing_footer' })} target="_blank" rel="noreferrer">Hablar por WhatsApp <ArrowRight/></a></div><small>© {new Date().getFullYear()} {business.name}. Todos los derechos reservados.</small></footer>
  </div>;
}
