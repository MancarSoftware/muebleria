import { ArrowRight, Check, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { business, whatsappLink } from '../config/business';

const image = (id:string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1500&q=85`;
type Kind = 'spaces'|'collections'|'inspiration'|'about';

const content = {
  spaces: {
    label:'GUÍA POR AMBIENTE', title:<>Cada habitación tiene<br/>su propio <em>ritmo.</em></>, intro:'No partimos de un mueble aislado. Partimos de lo que haces allí: descansar, compartir, concentrarte o simplemente dejar pasar la tarde.',
    items:[
      ['01','Sala','El lugar donde la casa se abre. Sofás profundos, mesas bajas y texturas que invitan a alargar la conversación.','photo-1616486338812-3dadae4b4ace','Ver piezas para la sala'],
      ['02','Dormitorio','Menos estímulos, mejores mañanas. Cabeceros suaves, maderas claras y una paleta que acompaña el descanso.','photo-1615529162924-f8605388461d','Ver piezas para dormir'],
      ['03','Comedor','Una mesa no mide solo centímetros: mide encuentros. Elige tamaño, material y sillas para tu forma de recibir.','photo-1617806118233-18e1de247200','Armar mi comedor'],
      ['04','Estudio','Diseñamos apoyo para las ideas: superficies tranquilas, almacenaje discreto y una silla que acompaña.','photo-1594620302200-9a762244a156','Ver oficina en casa']
    ]
  },
  collections: {
    label:'COLECCIONES CASA NATIVA', title:<>Un lenguaje para<br/>cada forma de <em>vivir.</em></>, intro:'Las colecciones son puntos de vista, no conjuntos cerrados. Combínalas libremente para construir una casa con una voz propia.',
    items:[
      ['NATURAL','Materia que se siente','Roble, lino y piedra en tonos cálidos. Para espacios luminosos que buscan calma sin perder carácter.','photo-1616486338812-3dadae4b4ace','Explorar Natural'],
      ['URBANA','Contraste con intención','Madera oscura, metal mate y perfiles definidos. Una colección precisa para departamentos y ritmos contemporáneos.','photo-1497366754035-f200968a6e72','Explorar Urbana'],
      ['NÓRDICA','Claridad cotidiana','Formas ligeras, tonos de avena y funcionalidad serena. Todo lo necesario, nada que distraiga.','photo-1615529162924-f8605388461d','Explorar Nórdica']
    ]
  },
  inspiration: {
    label:'CUADERNO DE CASA', title:<>Ideas que ayudan<br/>a mirar tu casa <em>distinto.</em></>, intro:'Guías breves para tomar decisiones con calma: distribución, escala, materiales y las preguntas que conviene hacer antes de comprar.',
    items:[
      ['LECTURA 01','Cómo hacer que una sala pequeña se sienta generosa','La clave no está en llenar los vacíos: está en definir circulación, altura visual y una pieza principal que haga el trabajo.','photo-1616486338812-3dadae4b4ace','Leer la guía'],
      ['LECTURA 02','Elegir una mesa para las reuniones que sí tienes','Cuatro medidas, dos materiales y una pregunta honesta: ¿cuántas personas se sientan realmente a comer cada semana?','photo-1617806118233-18e1de247200','Leer la guía'],
      ['LECTURA 03','Maderas claras: cómo lograr calidez sin monotonía','Mezcla vetas, textiles y piedra para que una base neutra tenga profundidad y no pierda su serenidad.','photo-1618220179428-22790b461013','Leer la guía']
    ]
  }
} as const;

function Landing({kind}:{kind:Exclude<Kind,'about'>}) { const page=content[kind]; return <><section className="page-hero"><p className="eyebrow">{page.label}</p><h1>{page.title}</h1><p>{page.intro}</p></section><section className={`story-list ${kind}`}>{page.items.map(([number,title,description,photo,action],index)=><article key={title}><img src={image(photo)} alt={title}/><div><p className="eyebrow">{number}</p><h2>{title}</h2><p>{description}</p><Link to="/catalog">{action} <ArrowRight/></Link></div>{kind==='spaces'&&<span className="story-number">{String(index+1).padStart(2,'0')}</span>}</article>)}</section></> }
function About(){return <><section className="page-hero about-hero"><p className="eyebrow">NUESTRA FORMA DE HACER</p><h1>Menos cosas.<br/>Mejores <em>historias.</em></h1><p>Casa Nativa nace en Quito para ayudar a construir hogares que envejecen con gracia, no modas que terminan rápido.</p></section><section className="about-story"><div><p className="eyebrow">NUESTRA PROMESA</p><h2>Elegimos piezas que te siguen el paso.</h2></div><p>Creemos que el buen diseño se reconoce con el tiempo: en una superficie que conserva su tacto, en un sofá que sigue siendo cómodo y en una mesa que reúne más recuerdos cada año.</p></section><section className="principles"><img src={image('photo-1600210492486-724fe5c67fb0')} alt="Detalle de mobiliario de madera"/><div>{[['Materiales honestos','Maderas, textiles y acabados elegidos por su carácter y duración.'],['Escala humana','Piezas pensadas para cuerpos, movimientos y hogares reales.'],['Acompañamiento cercano','Te ayudamos a decidir antes, durante y después de elegir.']].map(([title,description],n)=><article key={title}><span>0{n+1}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section><section className="showroom-cta"><p className="eyebrow">MEJOR EN PERSONA</p><h2>Ven a sentarte,<br/><em>tocar y elegir.</em></h2><Link className="light-button" to="/contact">Conocer el showroom <ArrowRight/></Link></section></>}
export function Editorial({kind}:{kind:Kind}) { return kind==='about'?<About/>:<Landing kind={kind}/> }
export function Contact(){return <section className="contact"><p className="eyebrow">HABLEMOS DE TU ESPACIO</p><h1>Ven a sentir<br/><em>los materiales.</em></h1><div className="contact-grid"><div><h2>Showroom</h2><p><MapPin/> {business.address}</p><p>{business.hours}</p><a className="dark-button" href={whatsappLink('Hola, quisiera agendar una visita al showroom.')}>Agendar visita</a></div><ContactForm/></div></section>}
function ContactForm(){const [sent,setSent]=useState(false);const [error,setError]=useState('');function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);if(!d.get('name')||!d.get('email')||!d.get('message'))return setError('Completa nombre, correo y mensaje.');setError('');setSent(true)}return <form className="contact-form" onSubmit={submit}>{sent?<div className="success"><h2>Mensaje recibido.</h2><p>Te responderemos muy pronto.</p></div>:<><label>Nombre<input name="name" required/></label><label>Correo electrónico<input name="email" type="email" required/></label><label>Teléfono<input name="phone" type="tel"/></label><label>¿En qué te ayudamos?<textarea name="message" required/></label>{error&&<p className="error">{error}</p>}<button className="dark-button">Enviar mensaje</button></>}</form>}
