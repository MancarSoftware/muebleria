import { ArrowRight, Check, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { business, whatsappLink } from '../config/business';
import { products } from '../data/products';
import { ProductCard } from '../components/ProductCard';

const image = (id:string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1500&q=85`;
type Kind = 'spaces'|'collections'|'inspiration'|'about';

const content = {
  spaces: {
    label:'GUÍA POR AMBIENTE', title:<>Cada habitación tiene<br/>su propio <em>ritmo.</em></>, intro:'No partimos de un mueble aislado. Partimos de lo que haces allí: descansar, compartir, concentrarte o simplemente dejar pasar la tarde.',
    items:[
      ['01','Sala','El lugar donde la casa se abre. Sofás profundos, mesas bajas y texturas que invitan a alargar la conversación.','photo-1616486338812-3dadae4b4ace','sala','Para una sala equilibrada, empieza por el sofá y deja al menos 70 cm de paso alrededor de la mesa de centro.',['p1','p5']],
      ['02','Dormitorio','Menos estímulos, mejores mañanas. Cabeceros suaves, maderas claras y una paleta que acompaña el descanso.','photo-1615529162924-f8605388461d','dormitorio','Elige la cama antes que el resto. Deja 60 cm libres a cada lado para circular y ubicar una mesa de noche.',['p3']],
      ['03','Comedor','Una mesa no mide solo centímetros: mide encuentros. Elige tamaño, material y sillas para tu forma de recibir.','photo-1617806118233-18e1de247200','comedor','Para seis personas, considera una mesa de 180–220 cm y reserva 90 cm detrás de cada silla para moverla con comodidad.',['p2','p4']],
      ['04','Estudio','Diseñamos apoyo para las ideas: superficies tranquilas, almacenaje discreto y una silla que acompaña.','photo-1594620302200-9a762244a156','oficina','Prioriza una superficie de 120 cm o más, luz lateral y almacenaje cercano para mantener la mesa despejada.',['p6']]
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
};

function Landing({kind}:{kind:Exclude<Kind,'about'>}) { if(kind==='spaces') return <Spaces page={content.spaces}/>; const page=kind==='collections'?content.collections:content.inspiration; return <><section className="page-hero"><p className="eyebrow">{page.label}</p><h1>{page.title}</h1><p>{page.intro}</p></section><section className={`story-list ${kind}`}>{page.items.map(([number,title,description,photo,action])=><article key={title}><img src={image(photo)} alt={title}/><div><p className="eyebrow">{number}</p><h2>{title}</h2><p>{description}</p><Link to="/catalog">{action} <ArrowRight/></Link></div></article>)}</section></> }
function Spaces({page}:{page:typeof content.spaces}){return <><section className="page-hero"><p className="eyebrow">{page.label}</p><h1>{page.title}</h1><p>{page.intro}</p></section><section className="space-guide">{page.items.map((item,index)=>{const [number,title,description,photo,space,tip,productIds]=item as [string,string,string,string,string,string,string[]];const curated=products.filter(product=>productIds.includes(product.id));return <article className="room-guide" key={title}><div className="room-intro"><img src={image(photo)} alt={`${title} Casa Nativa`}/><span className="story-number">{String(index+1).padStart(2,'0')}</span><div><p className="eyebrow">{number} · {title.toUpperCase()}</p><h2>{title}</h2><p>{description}</p><aside><b>Antes de elegir</b><p>{tip}</p></aside><div className="room-actions"><Link className="dark-button" to={`/catalog?space=${space}`}>Ver todo para {title.toLowerCase()} <ArrowRight/></Link><a href={whatsappLink(`Hola, necesito ayuda para amoblar mi ${title.toLowerCase()}.`)} target="_blank" rel="noreferrer">Pedir asesoría <ArrowRight/></a></div></div></div><div className="curated"><div><p className="eyebrow">SELECCIÓN PARA {title.toUpperCase()}</p><span>{curated.length} piezas disponibles</span></div><div className="room-products">{curated.map(product=><ProductCard key={product.id} product={product}/>)}</div></div></article>})}</section></>}
function About(){return <><section className="page-hero about-hero"><p className="eyebrow">NUESTRA FORMA DE HACER</p><h1>Menos cosas.<br/>Mejores <em>historias.</em></h1><p>Casa Nativa nace en Quito para ayudar a construir hogares que envejecen con gracia, no modas que terminan rápido.</p></section><section className="about-story"><div><p className="eyebrow">NUESTRA PROMESA</p><h2>Elegimos piezas que te siguen el paso.</h2></div><p>Creemos que el buen diseño se reconoce con el tiempo: en una superficie que conserva su tacto, en un sofá que sigue siendo cómodo y en una mesa que reúne más recuerdos cada año.</p></section><section className="principles"><img src={image('photo-1600210492486-724fe5c67fb0')} alt="Detalle de mobiliario de madera"/><div>{[['Materiales honestos','Maderas, textiles y acabados elegidos por su carácter y duración.'],['Escala humana','Piezas pensadas para cuerpos, movimientos y hogares reales.'],['Acompañamiento cercano','Te ayudamos a decidir antes, durante y después de elegir.']].map(([title,description],n)=><article key={title}><span>0{n+1}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section><section className="showroom-cta"><p className="eyebrow">MEJOR EN PERSONA</p><h2>Ven a sentarte,<br/><em>tocar y elegir.</em></h2><Link className="light-button" to="/contact">Conocer el showroom <ArrowRight/></Link></section></>}
export function Editorial({kind}:{kind:Kind}) { return kind==='about'?<About/>:<Landing kind={kind}/> }
export function Contact(){return <section className="contact"><p className="eyebrow">HABLEMOS DE TU ESPACIO</p><h1>Ven a sentir<br/><em>los materiales.</em></h1><div className="contact-grid"><div><h2>Showroom</h2><p><MapPin/> {business.address}</p><p>{business.hours}</p><a className="dark-button" href={whatsappLink('Hola, quisiera agendar una visita al showroom.')}>Agendar visita</a></div><ContactForm/></div></section>}
function ContactForm(){const [sent,setSent]=useState(false);const [error,setError]=useState('');function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);if(!d.get('name')||!d.get('email')||!d.get('message'))return setError('Completa nombre, correo y mensaje.');setError('');setSent(true)}return <form className="contact-form" onSubmit={submit}>{sent?<div className="success"><h2>Mensaje recibido.</h2><p>Te responderemos muy pronto.</p></div>:<><label>Nombre<input name="name" required/></label><label>Correo electrónico<input name="email" type="email" required/></label><label>Teléfono<input name="phone" type="tel"/></label><label>¿En qué te ayudamos?<textarea name="message" required/></label>{error&&<p className="error">{error}</p>}<button className="dark-button">Enviar mensaje</button></>}</form>}
