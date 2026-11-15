import type { ReactNode } from 'react';
import { track } from '../../lib/analytics';
import { scrollToId } from '../../lib/smoothScroll';
import { QuoteIcon } from './Icons';

/** Bouton secondaire (contour cyan) vers le simulateur de devis (#devis). */
export function QuoteButton({
  location,
  children,
  className = '',
  href = '#devis',
}: {
  location: string;
  children: ReactNode;
  className?: string;
  /** Sur une autre page que l'accueil : './index.html#devis'. */
  href?: string;
}) {
  return (
    <a
      href={href}
      className={`btn-water ${className}`}
      onClick={(e) => {
        track('start_quote', { location });
        if (href.startsWith('#')) {
          e.preventDefault();
          scrollToId(href.slice(1));
        }
      }}
    >
      <QuoteIcon className="shrink-0 text-water" />
      <span>{children}</span>
    </a>
  );
}
