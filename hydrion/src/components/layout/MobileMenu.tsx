import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { contact, mobileBar, nav } from '../../content';
import { scrollToId, startScroll, stopScroll } from '../../lib/smoothScroll';
import { AvailabilityBadge } from '../ui/AvailabilityBadge';
import { CallButton } from '../ui/CallButton';
import { CloseIcon } from '../ui/Icons';
import { QuoteButton } from '../ui/QuoteButton';
import { Logo } from '../ui/Logo';

type Props = { open: boolean; onClose: () => void; onHome: boolean };

/** Menu plein écran (< 1024 px). Dialog accessible : focus piégé, Échap, scroll bloqué. */
export function MobileMenu({ open, onClose, onHome }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    stopScroll();
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    // focus initial sur le premier lien (après le montage de l'animation)
    const t = window.setTimeout(() => focusables()[1]?.focus(), 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      startScroll();
    };
  }, [open, onClose]);

  const go = (e: React.MouseEvent, id: string) => {
    onClose();
    if (!onHome) return;
    e.preventDefault();
    // laisse le menu se fermer avant de scroller
    window.setTimeout(() => scrollToId(id), 60);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          id="menu-mobile"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[70] flex flex-col bg-night/95 backdrop-blur-xl lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
        >
          <div className="container-x flex h-16 items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink"
              aria-label="Fermer le menu"
            >
              <CloseIcon />
            </button>
          </div>

          <nav aria-label="Navigation mobile" className="container-x mt-6 flex-1 overflow-y-auto">
            <ul className="space-y-1">
              {nav.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={onHome ? `#${item.id}` : `./index.html#${item.id}`}
                    onClick={(e) => go(e, item.id)}
                    className="flex items-center justify-between border-b border-line py-4 font-display text-[28px] font-semibold tracking-tightest text-ink"
                  >
                    {item.label}
                    <span className="font-mono text-xs text-mist" aria-hidden="true">
                      0{i + 1}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>

          <div className="container-x space-y-3 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6">
            <AvailabilityBadge />
            <CallButton location="menu_mobile" size="lg" className="w-full">
              {`Appeler — ${contact.phoneDisplay}`}
            </CallButton>
            <QuoteButton
              location="menu_mobile"
              href={onHome ? '#devis' : './index.html#devis'}
              className="w-full"
            >
              {mobileBar.quote}
            </QuoteButton>
            <p className="pt-1 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-mist">
              {contact.hoursLong}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
