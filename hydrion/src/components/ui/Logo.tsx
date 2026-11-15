import { useId } from 'react';
import { brand } from '../../content';

/** Goutte stylisée : contour eau + « niveau » horizontal = l'eau sous contrôle. */
export function DropMark({ size = 30, className = '' }: { size?: number; className?: string }) {
  // id unique par instance : des id dupliqués cassent les dégradés quand une instance est masquée.
  const uid = useId().replace(/:/g, '');
  const grad = `hx-drop-${uid}`;
  const clip = `hx-clip-${uid}`;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="8" y1="3" x2="24" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00E5FF" />
          <stop offset="1" stopColor="#3D7BFF" />
        </linearGradient>
        <clipPath id={clip}>
          <path d="M16 3.2c0 0-9.3 10.4-9.3 16.6a9.3 9.3 0 0 0 18.6 0C25.3 13.6 16 3.2 16 3.2Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="18.4" width="32" height="14" fill={`url(#${grad})`} opacity="0.28" />
      </g>
      <path
        d="M16 3.2c0 0-9.3 10.4-9.3 16.6a9.3 9.3 0 0 0 18.6 0C25.3 13.6 16 3.2 16 3.2Z"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9.6 18.4h12.8" stroke="#00E5FF" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12.4 22.6a4 4 0 0 0 3.6 2.3" fill="none" stroke="#F2F6FF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <DropMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[17px] font-bold tracking-[0.12em] text-ink">{brand.name}</span>
        {!compact && (
          <span className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-mist">{brand.tagline}</span>
        )}
      </span>
    </span>
  );
}
