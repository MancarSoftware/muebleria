import { ArrowRight, Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { business } from '../config/business';
import { legal } from '../config/legal';

type LegalSection = { title: string; body: string[] };

const privacySections: LegalSection[] = [
  { title: '1. Responsable y contacto', body: [`${business.name} es responsable del tratamiento de los datos que nos entregas mediante este sitio. Para ejercer tus derechos o resolver dudas, escribe a ${business.email}.`] },
  { title: '2. Datos que recopilamos', body: ['Cuando envías una consulta o propuesta, recopilamos nombre, correo electrónico, número de WhatsApp, espacio de interés, medidas, presupuesto, productos seleccionados y el mensaje que nos compartes. La analítica del sitio registra actividad agregada y anónima; no envía nombres, correos, teléfonos ni mensajes a Google Analytics.'] },
  { title: '3. Para qué los usamos', body: ['Usamos tus datos únicamente para responder tu consulta, preparar una propuesta, coordinar una visita o entrega cuando corresponda, y dar seguimiento comercial a tu solicitud. No vendemos tus datos ni los usamos para publicidad de terceros.'] },
  { title: '4. Base y consentimiento', body: ['Al marcar la casilla de los formularios autorizas de forma libre, específica, informada e inequívoca el tratamiento necesario para atender tu solicitud. Puedes retirar ese consentimiento en cualquier momento escribiendo al correo indicado arriba.'] },
  { title: '5. Dónde se almacenan y comparten', body: ['Los datos de solicitudes se almacenan en Supabase para que el equipo autorizado gestione el catálogo y las conversaciones. Si activamos alertas por correo, Resend procesa únicamente la notificación necesaria para avisar al equipo. Google Analytics puede procesar métricas de navegación anónimas cuando esté habilitado. No compartimos datos de contacto con terceros para sus propios fines.'] },
  { title: '6. Conservación y seguridad', body: [`Conservamos las solicitudes durante ${legal.retentionPeriod}, salvo que exista una relación comercial o una obligación legal que requiera otro plazo. Aplicamos acceso restringido por roles y medidas técnicas razonables; ningún sistema conectado a internet puede prometer seguridad absoluta.`] },
  { title: '7. Tus derechos', body: ['Puedes solicitar acceso, rectificación, actualización, eliminación, oposición, portabilidad o suspensión del tratamiento de tus datos. Envíanos tu solicitud a nuestro correo y responderemos conforme a la Ley Orgánica de Protección de Datos Personales aplicable en Ecuador.'] },
  { title: '8. Cambios', body: ['Podemos actualizar esta política si cambian los servicios o el tratamiento de datos. Publicaremos la fecha de vigencia y pediremos un nuevo consentimiento cuando el cambio lo requiera.'] },
];

const termsSections: LegalSection[] = [
  { title: '1. Alcance del sitio', body: ['Este sitio presenta el catálogo, facilita solicitudes de asesoría y permite coordinar conversaciones con el showroom. No constituye una tienda con pago en línea ni una oferta contractual definitiva.'] },
  { title: '2. Productos y disponibilidad', body: ['Las fotografías, colores, materiales, dimensiones y precios se muestran como referencia comercial. La disponibilidad, acabado final, plazo de entrega, transporte, montaje y precio aplicable se confirman con el showroom antes de cualquier compra.'] },
  { title: '3. Propuestas de espacio', body: ['Las recomendaciones de proporción, medidas y circulación son orientativas. La persona usuaria debe verificar en sitio accesos, puertas, ventanas, instalaciones y medidas finales antes de decidir una compra.'] },
  { title: '4. Solicitudes y comunicaciones', body: ['Enviar un formulario o una propuesta no crea una obligación de compra ni reserva un producto. Al usar los canales de contacto, te comprometes a proporcionar información veraz y a usar el sitio de forma lícita y respetuosa.'] },
  { title: '5. Propiedad intelectual', body: ['El contenido, marca, diseño, textos, fotografías y catálogo pertenecen a sus titulares. No pueden reproducirse o explotarse sin autorización previa, salvo los usos permitidos por la ley.'] },
  { title: '6. Privacidad', body: ['El uso de los formularios también se rige por la Política de privacidad. Te recomendamos leerla antes de enviar información personal.'] },
  { title: '7. Legislación aplicable', body: ['Estos términos se interpretan de conformidad con la legislación ecuatoriana aplicable.'] },
];

export function PrivacyPolicy() {
  return <LegalPage eyebrow="DATOS PERSONALES" title={<>Tu información,<br/><em>con claridad.</em></>} intro="Explicamos qué datos recogemos, para qué los usamos y cómo puedes ejercer control sobre ellos." sections={privacySections}/>;
}

export function Terms() {
  return <LegalPage eyebrow="CONDICIONES DE USO" title={<>Diseñado para<br/><em>entenderse bien.</em></>} intro="Estas condiciones explican el alcance comercial del catálogo y de la asesoría ofrecida desde el sitio." sections={termsSections}/>;
}

function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: ReactNode; intro: string; sections: LegalSection[] }) {
  return <><section className="legal-hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p><small>Vigente desde el {legal.effectiveDate} · Versión {legal.policyVersion}</small></section><section className="legal-content"><aside><p className="eyebrow">EN RESUMEN</p><p>Usamos los datos de formularios para responder solicitudes reales. No vendemos datos personales.</p><Link to="/contact#contact-form">Hacer una consulta <ArrowRight/></Link></aside><div>{sections.map((section) => <article key={section.title}><h2>{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>)}<div className="legal-contact"><Mail/><div><b>Tus derechos sobre tus datos</b><p>Puedes pedirnos qué información tenemos sobre ti, corregirla, actualizarla o solicitar su eliminación. Escríbenos a <a href={`mailto:${business.email}?subject=${encodeURIComponent('Solicitud sobre datos personales')}`}>{business.email}</a> e indica cómo prefieres que te respondamos.</p></div></div></div></section></>;
}
