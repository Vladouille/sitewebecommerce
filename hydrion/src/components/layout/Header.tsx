import { useEffect, useRef, useState } from 'react';
import { nav } from '../../content';
import { useDockVisible } from '../../lib/dock';
import { scrollToId } from '../../lib/smoothScroll';
import { AvailabilityBadge } from '../ui/AvailabilityBadge';
import { CallButton } from '../ui/CallButton';
import { MenuIcon } from '../ui/Icons';
import { Logo } from '../ui/Logo';
import { MobileMenu } from './MobileMenu';

/**
 * Header fixe :
 *  - transparent en haut de page, verre dépoli dès qu'on scrolle ;
 *  - se cache au scroll vers le bas, réapparaît au scroll vers le haut ;
 *  - MAIS ne se cache jamais tant que le dock d'appel (barre mobile / pastille desktop)
 *    n'est pas visible → un numéro cliquable reste toujours à l'écran.
 */
export function Header({ onHome = true }: { onHome?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollingDown, setScrollingDown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const dockVisible = useDockVisible();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      const delta = y - lastY;
      if (Math.abs(delta) > 8) {
        setScrollingDown(delta > 0 && y > 160);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const hidden = scrollingDown && dockVisible && !menuOpen && !focusInside;
  const homeHref = onHome ? '#top' : './index.html';

  const goTo = (e: React.MouseEvent, id: string) => {
    if (!onHome) return; // lien normal vers ./index.html#id
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-[400ms] ease-out-power3 ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        } ${scrolled || !onHome ? 'glass border-x-0 border-t-0' : 'border-b border-transparent bg-transparent'}`}
        onFocus={() => setFocusInside(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusInside(false);
        }}
      >
        <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[76px]">
          <a
            href={homeHref}
            className="shrink-0 rounded-md"
            aria-label="HYDRION, retour à l’accueil"
            onClick={(e) => {
              if (!onHome) return;
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Logo />
          </a>

          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.id}>
                  <a
                    href={onHome ? `#${item.id}` : `./index.html#${item.id}`}
                    onClick={(e) => goTo(e, item.id)}
                    className="rounded-full px-3.5 py-2 text-[14.5px] font-medium text-mist transition-colors duration-200 hover:text-ink"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <AvailabilityBadge className="hidden xl:inline-flex" />
            {/* Mobile très étroit : l'icône seule (cible 48 px). Dès 480 px : le numéro complet. */}
            <CallButton location="header" iconOnlyMobile className="w-12 !px-0 sm:w-auto sm:!px-5" />
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onHome={onHome}
        onClose={() => {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        }}
      />
    </>
  );
}
