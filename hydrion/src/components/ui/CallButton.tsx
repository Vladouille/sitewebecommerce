import type { ReactNode } from 'react';
import { contact, telHref } from '../../content';
import { trackCall } from '../../lib/analytics';
import { PhoneIcon } from './Icons';

type Props = {
  /** Où se trouve le bouton (remonte dans l'événement click_call). */
  location: string;
  children?: ReactNode;
  className?: string;
  /** Icône qui vibre brièvement toutes les 4 s (désactivé si reduced motion). */
  ringing?: boolean;
  size?: 'md' | 'lg';
  /** Sous 480 px : icône seule (le texte reste lu par les lecteurs d'écran). */
  iconOnlyMobile?: boolean;
};

/** Lien d'appel cuivre. Toujours un vrai <a href="tel:+33…"> : fonctionne même si le JS plante. */
export function CallButton({ location, children, className = '', ringing = false, size = 'md', iconOnlyMobile = false }: Props) {
  return (
    <a
      href={telHref}
      onClick={() => trackCall(location)}
      className={`btn-copper ${size === 'lg' ? 'min-h-[56px] px-7 text-base' : ''} ${className}`}
      aria-label={typeof children === 'string' ? `${children} : ${contact.phoneDisplay}` : `Appeler le ${contact.phoneDisplay}`}
    >
      <PhoneIcon className={`shrink-0 ${ringing ? 'origin-[50%_60%] animate-ring' : ''}`} />
      <span className={iconOnlyMobile ? 'sr-only sm:not-sr-only' : undefined}>{children ?? contact.phoneDisplay}</span>
    </a>
  );
}
