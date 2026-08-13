import type { Product } from '../types/catalog';
import sofaOlmo from '../assets/products/sofa-olmo-editorial.webp';
import mesaAura from '../assets/products/mesa-aura-editorial.webp';
import mesaTrazo from '../assets/products/mesa-trazo-editorial.webp';
import camaLuna from '../assets/products/cama-luna-editorial.webp';
import sillaCedro from '../assets/products/silla-cedro-editorial.webp';
const img=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=85`;
export const products:Product[]=[
 {id:'p1',slug:'sofa-olmo',name:'Sofá Olmo',category:'Sofás',price:1290,description:'Silueta baja y profunda para conversaciones largas. Módulos que se acomodan a tu ritmo.',images:[sofaOlmo],materials:['Lino belga','Roble macizo'],dimensions:'240 × 96 × 72 cm',colors:['Arena','Oliva','Carbón'],featured:true,tags:['sala','modular','natural','coleccion-natural']},
 {id:'p2',slug:'mesa-aura',name:'Mesa Aura',category:'Mesas de comedor',price:980,description:'Una superficie serena de madera sólida para reunir seis historias alrededor.',images:[mesaAura],materials:['Nogal','Acabado mate'],dimensions:'200 × 95 × 75 cm',colors:['Nogal natural'],featured:true,tags:['comedor','seis personas','madera','coleccion-natural']},
 {id:'p3',slug:'cama-luna',name:'Cama Luna',category:'Camas',price:860,description:'Cabecero envolvente y líneas suaves que hacen del descanso un ritual.',images:[camaLuna],materials:['Bouclé','Pino reforestado'],dimensions:'160 × 200 cm',colors:['Marfil','Piedra'],featured:true,tags:['dormitorio','queen','claro','coleccion-nordica']},
 {id:'p4',slug:'silla-cedro',name:'Silla Cedro',category:'Sillas',price:188,description:'Curvas precisas, asiento generoso y veta honesta para todos los días.',images:[sillaCedro],materials:['Fresno','Tapiz de lana'],dimensions:'52 × 56 × 78 cm',colors:['Crema','Oliva'],featured:false,tags:['comedor','silla','madera','coleccion-nordica']},
 {id:'p5',slug:'mesa-trazo',name:'Mesa Trazo',category:'Mesas de centro',price:420,description:'Travertino y madera en una pieza de proporciones meditadas.',images:[mesaTrazo],materials:['Travertino','Roble'],dimensions:'120 × 70 × 38 cm',colors:['Piedra'],featured:false,tags:['sala','centro','piedra','coleccion-natural']},
 {id:'p6',slug:'escritorio-aire',name:'Escritorio Aire',category:'Oficina',price:590,description:'Una estación de trabajo contenida, diseñada para que las ideas respiren.',images:[img('photo-1497215728101-856f4ea42174')],materials:['Roble','Acero pintado'],dimensions:'140 × 65 × 74 cm',colors:['Roble claro','Carbón'],featured:false,tags:['oficina','escritorio','minimal','coleccion-urbana']}
];
export const categories=['Todos',...Array.from(new Set(products.map(p=>p.category)))];
