import '@google/model-viewer';
import { Box, Camera, ChevronLeft, ChevronRight, ScanLine, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { trackEvent } from '../lib/analytics';
import type { Product } from '../types/catalog';

type ArProductViewerProps = {
  products: Product[];
  placement?: 'detail' | 'selection';
};

export function ArProductViewer({ products, placement = 'detail' }: ArProductViewerProps) {
  const arProducts = useMemo(() => products.filter((product) => Boolean(product.arModelUrl)), [products]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(arProducts.length - 1, 0)));
  }, [arProducts.length]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  if (!arProducts.length) {
    return <aside className={`ar-unavailable ar-${placement}`}>
      <Box/>
      <div><b>Realidad aumentada en preparación</b><span>Esta pieza necesita su modelo 3D real para poder ubicarla con escala correcta en la cámara.</span></div>
    </aside>;
  }

  const activeProduct = arProducts[activeIndex];
  const move = (direction: 1 | -1) => setActiveIndex((current) => (current + direction + arProducts.length) % arProducts.length);
  const open = () => {
    setIsOpen(true);
    trackEvent('view_ar_model', { item_id: activeProduct.id, item_name: activeProduct.name, location: placement });
  };

  return <>
    <button type="button" className={`ar-launch ar-${placement}`} onClick={open}><ScanLine/> Ver en mi espacio <Camera/></button>
    {isOpen && <div className="ar-modal" role="dialog" aria-modal="true" aria-labelledby="ar-title">
      <button className="ar-backdrop" type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar visor de realidad aumentada"/>
      <section className="ar-panel">
        <header><div><p className="eyebrow">REALIDAD AUMENTADA</p><h2 id="ar-title">{activeProduct.name}<em> en tu espacio.</em></h2></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar"><X/></button></header>
        {arProducts.length > 1 && <nav className="ar-product-tabs" aria-label="Piezas disponibles para realidad aumentada">
          <button type="button" onClick={() => move(-1)} aria-label="Pieza anterior"><ChevronLeft/></button>
          <span>{activeIndex + 1} de {arProducts.length}</span>
          <button type="button" onClick={() => move(1)} aria-label="Pieza siguiente"><ChevronRight/></button>
        </nav>}
        <model-viewer
          key={activeProduct.id}
          src={activeProduct.arModelUrl}
          ios-src={activeProduct.arIosModelUrl}
          alt={`Modelo 3D a escala de ${activeProduct.name}`}
          ar
          ar-modes="scene-viewer quick-look webxr"
          ar-scale="fixed"
          ar-placement="floor"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1"
          interaction-prompt="auto"
          touch-action="pan-y"
        >
          <button slot="ar-button" type="button" className="ar-camera-button" onClick={() => trackEvent('launch_ar_camera', { item_id: activeProduct.id, item_name: activeProduct.name, location: placement })}><Camera/> Abrir cámara y ubicar</button>
          <div slot="poster" className="ar-loading"><Box/> Cargando modelo a escala…</div>
        </model-viewer>
        <div className="ar-help"><Camera/><span><b>En móvil:</b> toca “Abrir cámara y ubicar”. Podrás mover la pieza sobre el piso y comprobar el paso alrededor. En computadora puedes explorar el modelo en 3D.</span></div>
        <p className="ar-disclaimer">La experiencia requiere HTTPS y un navegador compatible. La escala usa las dimensiones registradas para esta pieza; revisa puertas, ventanas y desniveles antes de comprar.</p>
      </section>
    </div>}
  </>;
}
