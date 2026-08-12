export type InspirationGuide = {
  slug: string;
  eyebrow: string;
  title: string;
  deck: string;
  coverImage: string;
  readTime: string;
  category: string;
  intro: string;
  sections: { title: string; body: string; note?: string }[];
  productIds: string[];
  catalogFilter: string;
  whatsappMessage: string;
};

const photo = (id:string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=85`;

export const inspirationGuides: InspirationGuide[] = [
  {
    slug:'sala-pequena-con-amplitud', eyebrow:'GUÍA DE DISTRIBUCIÓN', category:'Sala', readTime:'4 min de lectura',
    title:'Cómo hacer que una sala pequeña se sienta generosa',
    deck:'No se trata de llenar cada vacío. Se trata de darle a cada recorrido, pieza y fuente de luz una razón para estar allí.',
    coverImage:photo('photo-1616486338812-3dadae4b4ace'),
    intro:'Una sala pequeña funciona mejor cuando la circulación es clara y una o dos piezas hacen el trabajo importante. Antes de comprar, mide el recorrido desde la entrada hasta la ventana y decide dónde ocurre la conversación.',
    sections:[
      {title:'Empieza por la circulación',body:'Reserva un paso de al menos 70 cm entre los muebles principales. Si debes elegir entre una mesa de centro más grande o un recorrido claro, el recorrido siempre gana.'},
      {title:'Usa un sofá con presencia, no demasiados asientos',body:'Un sofá de líneas bajas y profundas puede ordenar la sala mejor que varios muebles pequeños. Añade una butaca solo si mantiene abierta la vista y el paso.'},
      {title:'Haz que la mesa de centro acompañe',body:'Busca una pieza de unos dos tercios del largo del sofá y deja entre 35 y 45 cm para sentarte con comodidad.',note:'Medida útil: 70 cm de paso; 35–45 cm entre sofá y mesa de centro.'}
    ], productIds:['p1','p5'], catalogFilter:'sala', whatsappMessage:'Hola, necesito ayuda para elegir piezas para una sala pequeña.'
  },
  {
    slug:'elegir-mesa-de-comedor', eyebrow:'GUÍA DE MEDIDAS', category:'Comedor', readTime:'5 min de lectura',
    title:'Elegir una mesa para las reuniones que sí tienes',
    deck:'La mesa adecuada no es la más grande que cabe: es la que recibe bien a las personas que realmente se sientan en ella.',
    coverImage:photo('photo-1617806118233-18e1de247200'),
    intro:'Piensa primero en los hábitos: cuántos comen cada día, cuántos invitados recibes algunas veces al mes y cómo se usa el espacio el resto del tiempo. La respuesta suele ser más útil que una tendencia.',
    sections:[
      {title:'Mide para la gente, no solo para la mesa',body:'Deja 90 cm desde el borde de la mesa hasta el muro u otro mueble. Ese espacio permite retirar una silla y caminar sin pedir permiso.'},
      {title:'Elige la capacidad cotidiana',body:'Para cuatro personas, 120–160 cm suele ser suficiente. Para seis, considera 180–220 cm. Si el comedor se usa también para trabajo, una tapa resistente y mate es una inversión práctica.'},
      {title:'Las sillas completan la proporción',body:'Calcula 60 cm de ancho por comensal. Una silla visualmente ligera ayuda cuando el comedor comparte ambiente con la sala.',note:'Referencia: 90 cm detrás de cada silla; 60 cm de ancho por persona.'}
    ], productIds:['p2','p4'], catalogFilter:'comedor', whatsappMessage:'Hola, quiero elegir una mesa de comedor para mi espacio.'
  },
  {
    slug:'maderas-claras-con-calidez', eyebrow:'GUÍA DE MATERIALES', category:'Materialidad', readTime:'3 min de lectura',
    title:'Maderas claras: cómo lograr calidez sin monotonía',
    deck:'Una paleta suave no tiene por qué sentirse plana. La profundidad aparece cuando cambian las vetas, las texturas y la manera en que la luz toca cada superficie.',
    coverImage:photo('photo-1618220179428-22790b461013'),
    intro:'La madera clara crea una base tranquila. Para que el espacio conserve carácter, deja que otros materiales aporten contraste: textiles con trama, piedra mate y un acento más oscuro.',
    sections:[
      {title:'Trabaja con tres texturas',body:'Combina una madera de veta visible, un textil con cuerpo y una superficie mineral. No necesitas introducir muchos colores para generar profundidad.'},
      {title:'Deja que un acento ancle la paleta',body:'Una lámpara oscura, una obra gráfica o un cojín oliva puede darle dirección al conjunto sin romper su calma.'},
      {title:'Repite el tono, cambia el acabado',body:'Elige maderas de una familia parecida, pero alterna acabados: roble mate, fresno lavado o un detalle en nogal. El resultado se percibe intencional, no uniforme.',note:'Regla sencilla: madera + textil + mineral + un acento oscuro.'}
    ], productIds:['p3','p4'], catalogFilter:'coleccion-nordica', whatsappMessage:'Hola, necesito ayuda para combinar maderas claras en mi casa.'
  }
];

export const getInspirationGuide = (slug:string | undefined) => inspirationGuides.find(guide => guide.slug === slug);
