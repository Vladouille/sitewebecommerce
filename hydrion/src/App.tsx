import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { CallDock } from './components/layout/CallDock';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { Hero } from './components/sections/Hero';
import { Placeholders } from './components/sections/Placeholder';
import { LegalPage } from './components/sections/LegalPage';
import { initSmoothScroll, scrollToId } from './lib/smoothScroll';

export type Page = 'home' | 'legal';

export default function App({ page = 'home' }: { page?: Page }) {
  const onHome = page === 'home';

  useEffect(() => {
    const cleanup = initSmoothScroll();
    // Arrivée depuis une autre page sur ./index.html#tarifs : le navigateur a tenté
    // le saut avant l'hydratation → on le refait proprement.
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (onHome && id) requestAnimationFrame(() => scrollToId(id));
    return cleanup;
  }, [onHome]);

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#contenu"
        className="fixed left-4 top-3 z-[80] -translate-y-[200%] rounded-full bg-water px-5 py-3 font-display text-sm font-semibold text-night transition-transform focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <Header onHome={onHome} />
      <main id="contenu" tabIndex={-1} className="outline-none">
        {onHome ? (
          <>
            <Hero />
            <Placeholders />
          </>
        ) : (
          <LegalPage />
        )}
      </main>
      <Footer />
      <CallDock onHome={onHome} />
      <div className="grain" aria-hidden="true" />
    </MotionConfig>
  );
}
