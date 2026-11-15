import { brand, contact, footer, telHref } from '../../content';
import { trackCall } from '../../lib/analytics';
import { CallButton } from '../ui/CallButton';
import { ClockIcon, MailIcon, PinIcon } from '../ui/Icons';
import { Logo } from '../ui/Logo';

export function Footer() {
  const year = new Date().getFullYear();
  const hasCreditUrl = footer.credit.url !== '#';

  return (
    <footer className="pb-dock relative border-t border-line bg-abyss/60">
      <div className="container-x grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-20">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-[15px] leading-relaxed text-mist">{footer.pitch}</p>
          <CallButton location="footer" className="mt-7">
            {`Appeler — ${contact.phoneDisplay}`}
          </CallButton>
        </div>

        <div>
          <h2 className="label-mono">Contact</h2>
          <ul className="mt-5 space-y-4 text-[15px]">
            <li>
              <a
                href={telHref}
                onClick={() => trackCall('footer_text')}
                className="font-mono text-lg text-ink underline-offset-4 hover:underline"
              >
                {contact.phoneDisplay}
              </a>
            </li>
            <li className="flex items-start gap-3 text-mist">
              <ClockIcon className="mt-0.5 shrink-0 text-water" />
              {contact.hoursLong}
            </li>
            <li className="flex items-start gap-3 text-mist">
              <MailIcon className="mt-0.5 shrink-0 text-water" />
              <a href={`mailto:${contact.email}`} className="break-all hover:text-ink">
                {contact.email}
              </a>
            </li>
            <li className="flex items-start gap-3 text-mist">
              <PinIcon className="mt-0.5 shrink-0 text-water" />
              <span>
                {contact.address.street}, {contact.address.postalCode} {contact.address.city}
                <span className="block text-sm">(adresse fictive)</span>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="label-mono">Zone d’intervention</h2>
          <p className="mt-5 text-[15px] text-mist">{brand.area}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {footer.zones.map((z) => (
              <li key={z} className="rounded-full border border-line px-3 py-1 text-sm text-mist">
                {z}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-4 py-6 text-sm text-mist md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {brand.name} — {brand.tagline}
            <span aria-hidden="true"> · </span>
            {footer.legal.map((l) => (
              <a key={l.href} href={l.href} className="underline-offset-4 hover:text-ink hover:underline">
                {l.label}
              </a>
            ))}
          </p>
          {/* Mention obligatoire : discrète mais lisible (contraste AA). */}
          <p className="rounded-full border border-water/20 bg-water/[0.04] px-3.5 py-1.5 font-mono text-xs text-mist">
            {footer.demoNotice} conçue par{' '}
            {hasCreditUrl ? (
              <a href={footer.credit.url} className="text-ink underline underline-offset-4" rel="author">
                {footer.credit.name}
              </a>
            ) : (
              <span className="text-ink">{footer.credit.name}</span>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
