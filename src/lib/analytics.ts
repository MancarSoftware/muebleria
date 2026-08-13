import { supabase } from './supabase';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
const analyticsSessionKey = 'casa-nativa-analytics-session';
const sessionInactivityMs = 30 * 60 * 1000;
const supportedEvents = new Set(['page_view', 'view_item', 'add_to_space', 'remove_from_space', 'generate_lead', 'contact_whatsapp']);

type AnalyticsSession = { id: string; lastActivityAt: number };

function send(...args: unknown[]) {
  window.gtag?.(...args);
}

function rememberSession(session: AnalyticsSession) {
  try { window.sessionStorage.setItem(analyticsSessionKey, JSON.stringify(session)); } catch { /* Tracking remains anonymous if storage is unavailable. */ }
}

function getSession() {
  const now = Date.now();
  try {
    const stored = window.sessionStorage.getItem(analyticsSessionKey);
    const existing = stored ? JSON.parse(stored) as AnalyticsSession : null;
    if (typeof existing?.id === 'string' && Number.isFinite(existing.lastActivityAt) && now - existing.lastActivityAt < sessionInactivityMs) {
      const activeSession = { ...existing, lastActivityAt: now };
      rememberSession(activeSession);
      return { id: activeSession.id, isNew: false };
    }
  } catch {
    // A malformed or blocked session storage entry simply starts a fresh anonymous visit.
  }

  const nextSession: AnalyticsSession = { id: crypto.randomUUID(), lastActivityAt: now };
  rememberSession(nextSession);
  return { id: nextSession.id, isNew: true };
}

function currentPath() {
  const hashPath = window.location.hash.replace(/^#/, '').split('?')[0];
  const path = hashPath || window.location.pathname;
  return path.startsWith('/') ? path : `/${path}`;
}

function safeMetadata(parameters: Record<string, string | number | boolean | undefined>) {
  const text = (key: string, limit: number) => typeof parameters[key] === 'string' ? parameters[key].slice(0, limit) : undefined;
  const amount = (key: string) => typeof parameters[key] === 'number' && Number.isFinite(parameters[key]) && parameters[key] >= 0 ? parameters[key] : undefined;
  return {
    item_id: text('item_id', 80),
    item_name: text('item_name', 120),
    item_category: text('item_category', 80),
    room_type: text('room_type', 40),
    location: text('location', 80),
    item_count: amount('item_count'),
    value: amount('value'),
    currency: parameters.currency === 'USD' ? 'USD' : undefined,
  };
}

function persistSiteEvent(name: string, pagePath: string, sessionId: string, parameters: Record<string, string | number | boolean | undefined> = {}) {
  if (!supabase) return;
  void supabase.rpc('track_site_event', {
    p_event_name: name,
    p_page_path: pagePath.slice(0, 180),
    p_session_id: sessionId,
    p_metadata: safeMetadata(parameters),
  }).then(({ error }) => {
    if (error) console.warn('No se pudo registrar la actividad anónima del sitio.', error.code);
  });
}

function recordSiteEvent(name: string, pagePath: string, parameters: Record<string, string | number | boolean | undefined> = {}) {
  if (!supabase || !supportedEvents.has(name)) return;
  const session = getSession();
  if (session.isNew) persistSiteEvent('session_start', pagePath, session.id);
  persistSiteEvent(name, pagePath, session.id, parameters);
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
  recordSiteEvent('page_view', path.split('?')[0], { page_title: title });
  if (measurementId) send('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: title });
}

export function trackEvent(name: string, parameters: Record<string, string | number | boolean | undefined> = {}) {
  recordSiteEvent(name, currentPath(), parameters);
  if (measurementId) send('event', name, parameters);
}
