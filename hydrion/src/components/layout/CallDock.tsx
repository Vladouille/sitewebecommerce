import { useEffect } from 'react';
import { contact, mobileBar, telHref } from '../../content';
import { trackCall } from '../../lib/analytics';
import { setDockVisible, useDockVisible } from '../../lib/dock';
import { PhoneIcon } from '../ui/Icons';
import { QuoteButton } from '../ui/QuoteButton';

/**
 * Le « dock d'appel » : l'élément le plus important du site sur mobile.
 *  - < 768 px : barre fixée en bas, « Appeler » (cuivre) + « Devis 60 s » (cyan) ;
 *  - ≥ 768 px : pastille cuivre flottante en bas à droite.
 * Visible dès que les CTA du hero (#hero-cta) sortent de l'écran.
 * Sur une page sans hero (mentions légales) : toujours visible.
 * Caché = visibility:hidden → retiré du clavier et des lecteurs d'écran (pas besoin d'aria-hidden).
 */
export function CallDock({ onHome = true }: { onHome?: boolean }) {
  const visible = useDockVisible();

  useEffect(() => {
    const target = document.getElementById('hero-cta');
    if (!target || !('IntersectionObserver' in window)) {
      setDockVisible(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setDockVisible(!entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  const state = visible
    ? 'visible translate-y-0 opacity-100'
    : 'invisible translate-y-[120%] opacity-0';

  return (
    <>
      {/* Mobile : barre pleine largeur */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night/85 px-3 pt-3 backdrop-blur-lg transition-[transform,opacity,visibility] duration-[400ms] ease-out-expo md:hidden ${state}`}
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-[1.35fr_1fr] gap-2.5">
          <a
            href={telHref}
            onClick={() => trackCall('sticky_mobile')}
            className="btn-copper min-h-[56px] w-full px-4 text-base"
            aria-label={`Appeler le ${contact.phoneDisplay}`}
          >
            <PhoneIcon className="shrink-0" />
            {mobileBar.call}
          </a>
          <QuoteButton
            location="sticky_mobile"
            href={onHome ? '#devis' : './index.html#devis'}
            className="min-h-[56px] w-full !gap-2 !px-3 text-[15px]"
          >
            {mobileBar.quote}
          </QuoteButton>
        </div>
      </div>

      {/* Tablette / desktop : pastille flottante */}
      <a
        href={telHref}
        onClick={() => trackCall('floating_desktop')}
        className={`btn-copper fixed bottom-6 right-6 z-40 hidden !min-h-[56px] !px-6 transition-[transform,opacity,visibility,box-shadow] duration-[400ms] ease-out-expo md:inline-flex ${state}`}
        aria-label={`Appeler le ${contact.phoneDisplay}`}
      >
        <PhoneIcon className="shrink-0" />
        <span className="font-mono text-[15px] font-medium tracking-tight">{contact.phoneDisplay}</span>
      </a>
    </>
  );
}
