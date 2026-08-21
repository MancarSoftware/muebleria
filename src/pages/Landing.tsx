import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowRight, Check, Clock3, Mail, MapPin, Menu, MessageCircle, Phone, Sparkles, Star, X } from 'lucide-react';
import heroImage from '../assets/hero-showroom.webp';
import sofaImage from '../assets/products/sofa-olmo-editorial.webp';
import tableImage from '../assets/products/mesa-aura-editorial.webp';
import bedImage from '../assets/products/cama-luna-editorial.webp';
import chairImage from '../assets/products/silla-cedro-editorial.webp';
import { business, whatsappLink } from '../config/business';
import { trackEvent } from '../lib/analytics';

const navigation = [['Propuesta', '#propuesta'], ['Servicios', '#servicios'], ['Espacios', '#espacios'], ['Visítanos', '#visita']];
const services = [
  ['01', 'Curamos contigo', 'No tienes que saber de diseño. Partimos de cómo quieres vivir.'],
  ['02', 'Lo hacemos encajar', 'Escala, materiales y combinaciones que sí funcionan en tu espacio.'],
  ['03', 'Lo pruebas en persona', 'Toca, compara y decide con calma en nuestro showroom.'],
];
const rooms = [
  { image: sofaImage, name: 'Sala lenta', caption: 'Conversar, recostarse, quedarse.' },
  { image: tableImage, name: 'Comedor vivo', caption: 'El lugar donde pasan las cosas.' },
  { image: bedImage, name: 'Dormitorio suave', caption: 'Bajar el ritmo también es habitar.' },
  { image: chairImage, name: 'Pequeños gestos', caption: 'Las piezas que hacen el resto.' },
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
      <a className="landing-nav-cta" href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => trackEvent('contact_whatsapp', { location: 'landing_header' })} target="_blank" rel="noreferrer"><MessageCircle/> Hablemos</a>
      <button className="landing-menu-toggle" type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    {menuOpen && <motion.nav className="landing-mobile-menu" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} aria-label="Navegación móvil">{navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowRight/></a>)}<a className="landing-menu-whatsapp" href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => { trackEvent('contact_whatsapp', { location: 'landing_mobile_menu' }); setMenuOpen(false); }} target="_blank" rel="noreferrer">Escribir por WhatsApp <ArrowRight/></a></motion.nav>}

    <main>
      <section className="landing-hero" id="inicio">
        <div className="landing-hero-copy">
          <motion.p className="landing-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>SHOWROOM · QUITO · ECUADOR</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .06 }}>Muebles para<br/><em>vivir mejor,</em><br/>no para llenar.</motion.h1>
          <motion.p className="landing-hero-lead" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }}>Piezas con carácter y ayuda real para crear un espacio que se sienta totalmente tuyo.</motion.p>
          <motion.div className="landing-hero-actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }}><a className="landing-primary-button" href="#contacto">Hablemos de tu espacio <ArrowRight/></a><a className="landing-secondary-button" href="#espacios">Explorar ambientes <ArrowDownRight/></a></motion.div>
        </div>
        <motion.div className="landing-hero-collage" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .75, delay: .1 }}>
          <div className="landing-hero-main-photo"><img src={heroImage} alt="Sala cálida de Casa Nativa"/><span>CASA NATIVA<br/>DESDE QUITO</span></div>
          <div className="landing-hero-mini-photo"><img src={chairImage} alt="Silla de madera clara"/></div>
          <div className="landing-hero-badge"><Sparkles/><b>Sin fórmulas<br/>prefabricadas.</b><small>Tu casa, tu ritmo.</small></div>
          <div className="landing-hero-orbit">HECHO PARA HABITAR · HECHO PARA HABITAR ·</div>
        </motion.div>
      </section>

      <div className="landing-marquee" aria-hidden="true"><div>CASA NATIVA <Star/> MUEBLES CON ALMA <Star/> ESPACIOS CON INTENCIÓN <Star/> CASA NATIVA <Star/> MUEBLES CON ALMA <Star/> ESPACIOS CON INTENCIÓN <Star/></div></div>

      <section className="landing-intro" id="propuesta"><div className="landing-intro-marker">01 <span>LA IDEA</span></div><div className="landing-intro-content"><p className="landing-kicker">NO HAY DOS CASAS IGUALES</p><h2>Tu casa no necesita más cosas.<br/>Necesita <em>las correctas.</em></h2><p>Te acompañamos desde la primera idea hasta ese momento en que una pieza se siente exactamente donde debe estar.</p><div className="landing-intro-list"><span><Check/> Materiales que se disfrutan</span><span><Check/> Medidas que tienen sentido</span><span><Check/> Acompañamiento cercano</span></div></div></section>

      <section className="landing-services" id="servicios"><div className="landing-services-heading"><p className="landing-kicker">UNA EXPERIENCIA SIN PRESIÓN</p><h2>De “me gusta” a <em>“es perfecto aquí.”</em></h2><p>No se trata de venderte más. Se trata de ayudarte a decidir bien.</p></div><div className="landing-service-grid">{services.map(([number, title, description], index) => <motion.article key={number} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .45, delay: index * .08 }}><span>{number}</span><ArrowDownRight/><h3>{title}</h3><p>{description}</p></motion.article>)}</div></section>

      <section className="landing-rooms" id="espacios"><div className="landing-rooms-heading"><div><p className="landing-kicker">INSPIRACIÓN PARA EMPEZAR</p><h2>Así se ve<br/><em>sentirse en casa.</em></h2></div><p>Cada ambiente tiene una energía. Encuentra la que se parece a la tuya.</p></div><div className="landing-rooms-grid">{rooms.map((room, index) => <motion.figure className={`landing-room landing-room-${index + 1}`} key={room.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .5, delay: index * .06 }}><img src={room.image} alt={room.name}/><figcaption><small>0{index + 1} · {room.caption}</small><span>{room.name}<ArrowRight/></span></figcaption></motion.figure>)}</div></section>

      <section className="landing-visit" id="visita"><div className="landing-visit-copy"><p className="landing-kicker">VEN A PROBAR LAS PIEZAS</p><h2>Una foto inspira.<br/>Pero tocarlo lo <em>cambia todo.</em></h2><p>El showroom es para sentarte, comparar acabados y descubrir qué funciona contigo.</p><div className="landing-contact-details"><a href={business.mapsUrl} target="_blank" rel="noreferrer"><MapPin/>{business.address}</a><span><Clock3/>{business.hours}</span></div><a className="landing-light-button" href={business.mapsUrl} target="_blank" rel="noreferrer">Cómo llegar <ArrowRight/></a></div><div className="landing-visit-visual"><img src={tableImage} alt="Mesa de comedor Casa Nativa"/></div></section>

      <section className="landing-contact" id="contacto"><div className="landing-contact-copy"><p className="landing-kicker">EMPECEMOS POR UNA CONVERSACIÓN</p><h2>Tu próximo<br/>espacio empieza<br/><em>con un mensaje.</em></h2><p>Cuéntanos lo que estás imaginando. No hace falta tener las respuestas todavía.</p><div className="landing-contact-links"><a href={`tel:${business.phone}`}><Phone/>{business.phone}</a><a href={`mailto:${business.email}`}><Mail/>{business.email}</a></div></div><form className="landing-form" onSubmit={submitInquiry}><div className="landing-form-header"><span>HOLA <Sparkles/></span><p>¿Qué te gustaría transformar?</p></div><label>Tu nombre<input name="name" required autoComplete="name" placeholder="Cómo te llamas"/></label><label>Tu WhatsApp<input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Ingresa un teléfono ecuatoriano de 10 dígitos" placeholder="0986951419"/></label><label>El espacio<select name="space" defaultValue=""><option value="" disabled>Elige una opción</option><option>Sala</option><option>Comedor</option><option>Dormitorio</option><option>Oficina</option><option>Todo mi espacio</option></select></label><label>Tu idea<textarea name="details" placeholder="Piezas que buscas, medidas o la sensación que quieres lograr…"/></label><button className="landing-primary-button" type="submit">Enviar por WhatsApp <ArrowRight/></button>{submitted && <p className="landing-form-success"><Check/> Abrimos WhatsApp con tu mensaje preparado.</p>}</form></section>
    </main>

    <footer className="landing-footer"><a className="landing-brand" href="#inicio"><span>CN</span>{business.name}</a><p>Una casa que se siente <em>como tú.</em></p><div><span>Quito, Ecuador</span><a href={whatsappLink('Hola, quiero conocer Casa Nativa.')} onClick={() => trackEvent('contact_whatsapp', { location: 'landing_footer' })} target="_blank" rel="noreferrer">Hablar por WhatsApp <ArrowRight/></a></div><small>© {new Date().getFullYear()} {business.name}. Todos los derechos reservados.</small></footer>
  </div>;
}
