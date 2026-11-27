/** Réseau de carte. Les litiges CB ne sont pas contestables (doc Stripe). */
export type CardNetwork =
  | "visa"
  | "mastercard"
  | "cartes_bancaires"
  | "amex"
  | "autre"
  | "inconnu";

/** Statuts de litige Stripe (API Disputes). */
export type DisputeStatus =
  | "warning_needs_response"
  | "warning_under_review"
  | "warning_closed"
  | "needs_response"
  | "under_review"
  | "won"
  | "lost"
  | "prevented"
  | "inconnu";

/**
 * Un litige après nettoyage. MINIMISATION RGPD : ce type ne contient AUCUNE
 * donnée personnelle d'élève (ni nom, ni email, ni adresse, ni IP).
 */
export interface CleanDispute {
  /** Identifiant Stripe du litige (dp_…), sert à dédupliquer. */
  id: string;
  amountCents: number;
  /** Code devise ISO en minuscules (eur, usd…). */
  currency: string;
  createdAt: Date | null;
  /** Motif Stripe normalisé (fraudulent, product_not_received…). */
  reason: string;
  status: DisputeStatus;
  evidenceDueBy: Date | null;
  network: CardNetwork;
}

export interface RejectedRow {
  /** Numéro de ligne dans le fichier (1 = première ligne de données). */
  line: number;
  motif: string;
}

export interface ParseResult {
  disputes: CleanDispute[];
  rejected: RejectedRow[];
  /** Colonnes obligatoires absentes : si non vide, le fichier est inutilisable. */
  missingRequiredColumns: string[];
  /** Colonnes utiles mais facultatives absentes (ex. réseau de carte). */
  missingOptionalColumns: string[];
  /** Nombre de colonnes ignorées (données non nécessaires, jamais lues). */
  ignoredColumnCount: number;
}
