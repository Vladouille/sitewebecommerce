import { hero } from '../../content';
import { CallButton } from '../ui/CallButton';
import { QuoteButton } from '../ui/QuoteButton';
import { AvailabilityBadge } from '../ui/AvailabilityBadge';

/**
 * HERO — texte + CTA rendus immédiatement en HTML (LCP rapide, lisible même sans JS).
 * La scène 3D (phase 4) viendra se poser derrière, chargée en lazy.
 * Le fond CSS ci-dessous sert à la fois d'état de chargement et de fallback appareils faibles.
 */
export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <HeroBackdrop />

      <div className="container-x relative flex min-h-[100svh] flex-col justify-center pb-12 pt-24 md:pb-20 lg:pt-28">
        <div className="max-w-[640px] text-center lg:text-left">
          <p className="label-mono">{hero.eyebrow}</p>

          <h1
            id="hero-title"
            className="mt-4 text-[clamp(1.75rem,7.9vw,4.6rem)] leading-[1.04] [text-wrap:wrap] md:mt-5"
          >
            <span className="block">{hero.titleHook}</span>
            {hero.titleStart}{' '}
            {/* nowrap : la promesse « en 30 minutes. » ne se coupe jamais */}
            <span className="whitespace-nowrap bg-water-grad bg-clip-text text-transparent">
              {hero.titleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-[34rem] text-[16px] leading-relaxed text-mist md:text-lg lg:mx-0">
            {hero.subtitle}
          </p>

          <div
            id="hero-cta"
            className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <CallButton location="hero" size="lg" ringing>
              {hero.ctaCall}
            </CallButton>
            <QuoteButton location="hero" className="min-h-[56px] px-7 text-base">
              {hero.ctaQuote}
            </QuoteButton>
          </div>

          {/* ≥ 1280 px le badge est déjà dans le header : pas de doublon. */}
          <div className="mt-5 flex justify-center lg:justify-start xl:hidden">
            <AvailabilityBadge />
          </div>

          <ul className="mt-8 grid grid-cols-3 gap-3 border-t border-line pt-6 text-left md:max-w-[560px]">
            {hero.trust.map((t) => (
              <li key={t.label}>
                <span className="block font-display text-lg font-semibold tracking-tight text-ink md:text-2xl">
                  {t.value}
                </span>
                <span className="mt-1 block text-xs leading-snug text-mist md:text-sm">{t.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Fond du hero : dégradés « eau » + grille technique. Animation CSS légère (transform uniquement). */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="bg-blueprint absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black_20%,transparent_75%)]" />
      <div className="hero-blob absolute -right-[20%] top-[8%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.16)_0%,rgba(61,123,255,0.10)_35%,transparent_68%)] lg:-right-[8%]" />
      <div className="absolute -left-[30%] bottom-[-30%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgba(61,123,255,0.12)_0%,transparent_65%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-night" />
    </div>
  );
}
