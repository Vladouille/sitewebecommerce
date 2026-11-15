import { availability } from '../../content';

export function AvailabilityBadge({ className = '' }: { className?: string }) {
  if (!availability.enabled) return null;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/[0.08] px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-success ${className}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      {availability.label(availability.count)}
    </span>
  );
}
