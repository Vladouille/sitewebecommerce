/**
 * Tracking prêt à brancher (Google Tag Manager, GA4, Matomo Tag Manager…).
 * Chaque action de conversion pousse un événement dans window.dataLayer.
 * Il suffit d'ajouter le conteneur GTM dans index.html pour que tout remonte.
 *
 * ⚠️ RGPD : GTM / GA4 déposent des cookies → bandeau de consentement obligatoire
 * avant de les activer. Alternative sans bandeau : Plausible ou Matomo sans cookie.
 */

export type AnalyticsEvent =
  | 'click_call'
  | 'start_quote'
  | 'quote_step_1'
  | 'quote_step_2'
  | 'quote_step_3'
  | 'quote_step_4'
  | 'submit_quote';

type DataLayerEntry = { event: AnalyticsEvent; [key: string]: unknown };

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
  }
}

export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}): void {
  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event, ...params, ts: Date.now() });
    if (import.meta.env.DEV) console.info('[analytics]', event, params);
  } catch {
    /* le tracking ne doit jamais casser un appel */
  }
}

/** Raccourci : à appeler sur chaque lien tel:. `location` = où se trouvait le bouton. */
export const trackCall = (location: string) => track('click_call', { location });
