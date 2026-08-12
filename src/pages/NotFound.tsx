import { Link } from 'react-router-dom';
export function NotFound(){return <section className="not-found"><p className="eyebrow">ERROR 404</p><h1>Esta habitación<br/>no existe <em>aquí.</em></h1><p>Tal vez la pieza que buscas está en nuestro catálogo.</p><Link className="dark-button" to="/catalog">Ir al catálogo</Link></section>}
