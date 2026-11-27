const DAY_MS = 24 * 60 * 60 * 1000;

export type Urgency = "expire" | "critique" | "urgent" | "normal";

/**
 * Nombre de jours restants avant l'échéance, arrondi au jour supérieur.
 * 0 = dernier jour. Négatif = échéance dépassée.
 */
export function daysUntil(due: Date, now: Date): number {
  const diff = due.getTime() - now.getTime();
  return diff < 0 ? -Math.ceil(-diff / DAY_MS) : Math.ceil(diff / DAY_MS);
}

/** Moins de 3 jours = critique (un dossier demande en pratique 1 à 2 jours avec relecture humaine). */
export function urgencyFor(due: Date, now: Date): Urgency {
  if (due.getTime() <= now.getTime()) return "expire";
  const days = daysUntil(due, now);
  if (days <= 3) return "critique";
  if (days <= 7) return "urgent";
  return "normal";
}
