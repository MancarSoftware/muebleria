import { AnimatePresence, motion } from 'framer-motion';
import { Heart, MapPin, Menu, MessageCircle, Search, X } from 'lucide-react';
import { siFacebook, siInstagram, siTiktok } from 'simple-icons';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { business, whatsappLink } from '../config/business';
import { useSpacePlanner } from '../hooks/useSpacePlanner';
import { trackEvent, trackPageView } from '../lib/analytics';

const links = [['Inicio', '/'], ['Catálogo', '/catalog'], ['Espacios', '/spaces'], ['Colecciones', '/collections'], ['Inspiración', '/inspiration'], ['Nosotros', '/about'], ['Contacto', '/contact']];
const footerLinks = [['Catálogo', '/catalog'], ['Espacios', '/spaces'], ['Colecciones', '/collections'], ['Inspiración', '/inspiration'], ['Sobre nosotros', '/about'], ['Contacto', '/contact']];
const socials = [{ key: 'instagram', label: 'Instagram', icon: siInstagram }, { key: 'facebook', label: 'Facebook', icon: siFacebook }, { key: 'tiktok', label: 'TikTok', icon: siTiktok }] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const planner = useSpacePlanner();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const update = () => setScrolled(scrollY > 24);
    update();
    addEventListener('scroll', update, { passive: true });
    return () => removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    const labels: Record<string, string> = { '/': 'Diseño para habitar', '/catalog': 'Catálogo', '/space': 'Mi espacio', '/spaces': 'Espacios', '/collections': 'Colecciones', '/inspiration': 'Inspiración', '/about': 'Nosotros', '/contact': 'Contacto' };
    setOpen(false);
    document.title = `${business.name} — ${labels[location.pathname] || 'Página no encontrada'}`;
    trackPageView(`${location.pathname}${location.search}`, document.title);
    scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.search]);

  return <>
    <header className={`site-header ${!isHome ? 'header-light' : ''} ${scrolled ? 'header-scrolled' : ''}`}>
      <Link className="brand" to="/"><i>CN</i><span>{business.name}</span></Link>
      <nav aria-label="Navegación principal">{links.map(([name, path]) => <NavLink key={path} to={path}>{name}</NavLink>)}</nav>
      <div className="actions">
        <Link aria-label="Buscar en catálogo" to="/catalog"><Search/></Link>
        <Link className="space-link" aria-label="Ver mi espacio" to="/space"><Heart fill={planner.items.length ? 'currentColor' : 'none'}/>{planner.items.length > 0 && <b>{planner.items.length}</b>}</Link>
        <button aria-label="Abrir menú" onClick={() => setOpen(true)}><Menu/></button>
      </div>
    </header>
    <AnimatePresence>{open && <motion.aside className="mobile-nav" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}><button onClick={() => setOpen(false)} aria-label="Cerrar menú"><X/></button>{links.map(([name, path]) => <Link key={path} to={path}>{name}</Link>)}<Link to="/space">Mi espacio ({planner.items.length})</Link></motion.aside>}</AnimatePresence>
    <main>{children}</main>
    <Footer/>
  </>;
}

function Footer() {
  return <footer className="site-footer"><div className="footer-top"><div className="footer-brand"><Link className="brand" to="/"><i>CN</i><span>{business.name}</span></Link><h2>Muebles que<br/>dejan espacio<br/>para <em>vivir.</em></h2><a className="footer-whatsapp" href={whatsappLink('Hola, quiero conversar sobre mi espacio.')} onClick={() => trackEvent('contact_whatsapp', { location: 'footer' })} target="_blank" rel="noreferrer"><MessageCircle/> Hablar por WhatsApp <span>↗</span></a></div><div className="footer-nav"><p className="footer-label">EXPLORAR</p><div>{footerLinks.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</div></div><div className="footer-visit"><p className="footer-label">SHOWROOM</p><a href={business.mapsUrl} target="_blank" rel="noreferrer"><MapPin/>{business.address}</a><span>{business.hours}</span><a href={`tel:${business.phone}`}>{business.phone}</a><a href={`mailto:${business.email}`}>{business.email}</a></div><div className="footer-cta"><p className="footer-label">AGENDA UNA VISITA</p><p>Conversemos sobre tu espacio y probemos las piezas en persona.</p><Link to="/contact">Ir a contacto <span>↗</span></Link></div></div><div className="footer-bottom"><div className="social-links" aria-label="Redes sociales">{socials.map((social) => <a key={social.key} href={business.socials[social.key]} aria-label={`Visitar ${business.name} en ${social.label}`} target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={social.icon.path}/></svg></a>)}</div><small>© {new Date().getFullYear()} {business.name}. Todos los derechos reservados.</small><span>Quito, Ecuador</span><span>Diseñado para habitar.</span></div></footer>;
}
