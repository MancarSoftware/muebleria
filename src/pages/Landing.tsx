import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Clock3, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import heroImage from '../assets/hero-showroom.webp';
import sofaImage from '../assets/products/sofa-olmo-editorial.webp';
import tableImage from '../assets/products/mesa-aura-editorial.webp';
import bedImage from '../assets/products/cama-luna-editorial.webp';
import chairImage from '../assets/products/silla-cedro-editorial.webp';
import { business, whatsappLink } from '../config/business';
import { trackEvent } from '../lib/analytics';

const services = [
  ['01', 'Piezas con intención', 'Muebles de líneas cálidas y materiales que acompañan la vida diaria.'],
  ['02', 'Asesoría para tu espacio', 'Te ayudamos a elegir escala, composición y piezas que dialoguen entre sí.'],
  ['03', 'Visita al showroom', 'Ven, toca los acabados y entiende cada pieza antes de decidir.'],
];

const gallery = [
  { src: sofaImage, alt: 'Sofá en una sala luminosa', label: 'Sala' },
  { src: tableImage, alt: 'Mesa de comedor de madera', label: 'Comedor' },
  { src: bedImage, alt: 'Cama en dormitorio sereno', label: 'Dormitorio' },
  { src: chairImage, alt: 'Silla de madera clara', label: 'Detalles' },
];

const navigation = [['La propuesta', '#propuesta'], ['Cómo trabajamos', '#proceso'], ['Espacios', '#espacios'], ['Contacto', '#contacto']];

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitInquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const space = String(data.get('space') ?? '').trim();
    const details = String(data.get('details') ?? '').trim();
    const message = `Hola, soy ${name}. Quiero conversar sobre ${space || 'mi espacio'}${phone ? `. Mi teléfono es ${phone}` : ''}${details ? `. ${details}` : ''}`;
    trackEvent('contact_whatsapp', { location: 'landing_form', room_type: space || undefined });
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return <div className="landing-site">
    <header className="landing-nav">
      <a className="landing-brand" href="#inicio" aria-label={`Ir al inicio de ${business.name}`}><span>CN</span>{business.name}</a>
      <nav aria-label="Navegación principal">{navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <a className="landing-nav-cta" href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => trackEvent('contact_whatsapp', { location: 'landing_header' })} target="_blank" rel="noreferrer"><MessageCircle/> Hablemos</a>
      <button className="landing-menu-toggle" type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    {menuOpen && <motion.nav className="landing-mobile-menu" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} aria-label="Navegación móvil">{navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}<a href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => { trackEvent('contact_whatsapp', { location: 'landing_mobile_menu' }); setMenuOpen(false); }} target="_blank" rel="noreferrer">Escribir por WhatsApp <ArrowRight/></a></motion.nav>}

    <main>
      <section className="landing-hero" id="inicio">
        <div className="landing-hero-copy">
          <motion.p className="landing-kicker" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>MUEBLES · ASESORÍA · QUITO</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .08 }}>Tu espacio<br/>merece sentirse<br/><em>como tú.</em></motion.h1>
          <motion.p className="landing-lead" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .16 }}>Piezas honestas y asesoría cercana para habitar con más calma, intención y sentido.</motion.p>
          <motion.div className="landing-hero-actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .24 }}><a className="landing-primary-button" href="#contacto">Cuéntanos tu idea <ArrowRight/></a><a className="landing-text-link" href="#propuesta">Conocer la propuesta <ArrowDownRight/></a></motion.div>
        </div>
        <div className="landing-hero-image"><img src={heroImage} alt="Interior cálido con muebles Casa Nativa"/><div className="landing-image-note"><span>Casa Nativa</span><span>Quito · 2026</span></div></div>
      </section>

      <section className="landing-intro" id="propuesta"><p className="landing-kicker">UNA FORMA MÁS PERSONAL DE ELEGIR</p><div><h2>No se trata de llenar una casa.<br/>Se trata de <em>hacerle lugar a tu vida.</em></h2><p>Casa Nativa selecciona piezas con presencia y te acompaña a encontrar las que realmente funcionen para tu ritmo, tus medidas y tu manera de estar.</p></div></section>

      <section className="landing-services" id="proceso"><div className="landing-section-heading"><p className="landing-kicker">CÓMO PODEMOS AYUDARTE</p><h2>Elegir no tiene por qué ser <em>complicado.</em></h2></div><div className="landing-service-list">{services.map(([number, title, description], index) => <motion.article key={number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .5, delay: index * .08 }}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div><ArrowDownRight/></motion.article>)}</div></section>

      <section className="landing-gallery" id="espacios"><div className="landing-section-heading"><p className="landing-kicker">ESPACIOS PARA QUEDARSE</p><h2>Una casa con <em>ritmo propio.</em></h2></div><div className="landing-gallery-grid">{gallery.map((item, index) => <motion.figure key={item.label} className={`landing-gallery-card gallery-card-${index + 1}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .55, delay: index * .06 }}><img src={item.src} alt={item.alt}/><figcaption>{item.label}<ArrowUpRight/></figcaption></motion.figure>)}</div></section>

      <section className="landing-visit"><div className="landing-visit-image"><img src={tableImage} alt="Mesa Casa Nativa en un comedor"/></div><div className="landing-visit-copy"><p className="landing-kicker">VEN A CONOCER LAS PIEZAS</p><h2>La textura, la escala y la comodidad se entienden mejor <em>en persona.</em></h2><div className="landing-contact-details"><a href={business.mapsUrl} target="_blank" rel="noreferrer"><MapPin/>{business.address}</a><span><Clock3/>{business.hours}</span></div><a className="landing-outline-button" href={business.mapsUrl} target="_blank" rel="noreferrer">Ver ubicación <ArrowRight/></a></div></section>

      <section className="landing-contact" id="contacto"><div className="landing-contact-copy"><p className="landing-kicker">HABLEMOS DE TU ESPACIO</p><h2>Una conversación puede cambiar <em>la casa.</em></h2><p>No necesitas tener todo decidido. Cuéntanos qué quieres resolver y empezamos por ahí.</p><div><a href={`tel:${business.phone}`}><Phone/>{business.phone}</a><a href={`mailto:${business.email}`}><Mail/>{business.email}</a></div></div><form className="landing-form" onSubmit={submitInquiry}><label>Tu nombre<input name="name" required autoComplete="name" placeholder="Cómo te llamas"/></label><label>Tu WhatsApp<input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Ingresa un teléfono ecuatoriano de 10 dígitos" placeholder="0986951419"/></label><label>¿Qué te gustaría resolver?<select name="space" defaultValue=""><option value="" disabled>Elige una opción</option><option>Sala</option><option>Comedor</option><option>Dormitorio</option><option>Oficina</option><option>Todo mi espacio</option></select></label><label>Cuéntanos un poco más<textarea name="details" placeholder="Piezas que buscas, medidas aproximadas o estilo que te gusta…"/></label><button className="landing-primary-button" type="submit">Enviar por WhatsApp <ArrowRight/></button>{submitted && <p className="landing-form-success"><Check/> Abrimos WhatsApp con tu mensaje preparado.</p>}</form></section>
    </main>

    <footer className="landing-footer"><a className="landing-brand" href="#inicio"><span>CN</span>{business.name}</a><p>Muebles que dejan espacio para <em>vivir.</em></p><div><span>Quito, Ecuador</span><a href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => trackEvent('contact_whatsapp', { location: 'landing_footer' })} target="_blank" rel="noreferrer">Hablar por WhatsApp <ArrowRight/></a></div><small>© {new Date().getFullYear()} {business.name}. Todos los derechos reservados.</small></footer>
  </div>;
}
