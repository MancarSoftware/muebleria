declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

function send(...args: unknown[]) {
  window.gtag?.(...args);
}

export function initializeAnalytics() {
  if (!measurementId || document.querySelector(`script[data-ga-id="${measurementId}"]`)) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.gaId = measurementId;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
  send('js', new Date());
  send('config', measurementId, { send_page_view: false });
}

export function trackPageView(path: string, title: string) {
  if (!measurementId) return;
  send('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: title });
}

export function trackEvent(name: string, parameters: Record<string, string | number | boolean | undefined> = {}) {
  if (!measurementId) return;
  send('event', name, parameters);
}
