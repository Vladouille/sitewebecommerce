import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let tick: ((time: number) => void) | null = null;

/**
 * Lenis synchronisé avec ScrollTrigger (piège n°2 du brief) :
 *  - un seul rAF : celui du ticker GSAP pilote Lenis ;
 *  - chaque scroll Lenis met à jour ScrollTrigger ;
 *  - lagSmoothing(0) évite les sauts des sections épinglées.
 * Désactivé si prefers-reduced-motion. Sur tactile, Lenis laisse le scroll natif (syncTouch: false).
 */
export function initSmoothScroll(): () => void {
  if (prefersReducedMotion() || lenis) return () => {};

  lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    if (tick) gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
    tick = null;
  };
}

export function stopScroll() {
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
}

export function startScroll() {
  lenis?.start();
  document.documentElement.style.overflow = '';
}

/** Scroll vers une section (avec ou sans Lenis), puis focus pour les lecteurs d'écran. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // L'espace sous le header vient UNIQUEMENT du CSS (`scroll-margin-top` dans index.css),
  // respecté à la fois par Lenis et par scrollIntoView → une seule source de vérité.
  if (lenis) {
    lenis.scrollTo(el, { duration: 1.2 });
  } else {
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  history.replaceState(null, '', `#${id}`);
}
