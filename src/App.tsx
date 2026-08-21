import { useEffect } from 'react';
import { initializeAnalytics, trackPageView } from './lib/analytics';
import { Landing } from './pages/Landing';

export default function App() {
  useEffect(() => {
    document.title = 'Casa Nativa — Muebles y asesoría para habitar';
    initializeAnalytics();
    trackPageView('/', document.title);
  }, []);

  return <Landing/>;
}
