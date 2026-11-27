import type { CardNetwork, DisputeStatus } from "./types";

/** "Card Brand" / "card_brand" / " Marque de la carte " → "card brand" … */
export function normalizeHeader(raw: string): string {
  return raw
    .replace(/^﻿/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[_\-.]+/g, " ")
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(raw: string): string {
  return normalizeHeader(raw).replace(/ /g, "_");
}

/**
 * Convertit un montant en unités principales ("49.00", "1 234,50", "€49")
 * en centimes. Renvoie null si illisible ou négatif.
 */
export function parseAmountToCents(raw: string): number | null {
  let s = raw.replace(/[\s  €$£]/g, "").replace(/[a-z]/gi, "");
  if (s === "" || s.startsWith("-")) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    // Format français : "1.234,50" ou "49,00"
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // Format anglais : "1,234.50"
    s = s.replace(/,/g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [units = "0", decimals = ""] = s.split(".");
  return Number(units) * 100 + Number(decimals.padEnd(2, "0"));
}

/** Accepte ISO ("2026-03-14 10:22:00"), "14/03/2026" (format FR) ou timestamp Unix. */
export function parseDate(raw: string): Date | null {
  const s = raw.trim();
  if (s === "") return null;
  if (/^\d{9,10}$/.test(s)) return new Date(Number(s) * 1000);
  const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?/);
  if (fr) {
    const [, d, m, y, hh = "00", mm = "00"] = fr;
    const date = new Date(`${y}-${m}-${d}T${hh}:${mm}:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const iso = s.replace(" ", "T");
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeNetwork(raw: string): CardNetwork {
  const s = slug(raw);
  if (s === "") return "inconnu";
  if (s.includes("visa")) return "visa";
  if (s.includes("master")) return "mastercard";
  if (s === "cb" || s.includes("cartes_bancaires") || s.includes("carte_bancaire")) {
    return "cartes_bancaires";
  }
  if (s.includes("amex") || s.includes("american_express")) return "amex";
  return "autre";
}

const STATUSES: readonly DisputeStatus[] = [
  "warning_needs_response",
  "warning_under_review",
  "warning_closed",
  "needs_response",
  "under_review",
  "won",
  "lost",
  "prevented",
];

const STATUS_ALIASES: Record<string, DisputeStatus> = {
  gagne: "won",
  perdu: "lost",
  reponse_requise: "needs_response",
  reponse_necessaire: "needs_response",
  en_cours_d_examen: "under_review",
  en_examen: "under_review",
  inquiry_needs_response: "warning_needs_response",
  inquiry_under_review: "warning_under_review",
  inquiry_closed: "warning_closed",
};

export function normalizeStatus(raw: string): DisputeStatus {
  const s = slug(raw);
  if ((STATUSES as readonly string[]).includes(s)) return s as DisputeStatus;
  return STATUS_ALIASES[s] ?? "inconnu";
}

const REASON_ALIASES: Record<string, string> = {
  fraudulent: "fraudulent",
  fraud: "fraudulent",
  frauduleux: "fraudulent",
  fraude: "fraudulent",
  product_not_received: "product_not_received",
  produit_non_recu: "product_not_received",
  product_unacceptable: "product_unacceptable",
  produit_inacceptable: "product_unacceptable",
  subscription_canceled: "subscription_canceled",
  subscription_cancelled: "subscription_canceled",
  abonnement_annule: "subscription_canceled",
  credit_not_processed: "credit_not_processed",
  remboursement_non_traite: "credit_not_processed",
  duplicate: "duplicate",
  doublon: "duplicate",
  unrecognized: "unrecognized",
  non_reconnu: "unrecognized",
  general: "general",
  customer_initiated: "customer_initiated",
  noncompliant: "noncompliant",
  bank_cannot_process: "bank_cannot_process",
  check_returned: "check_returned",
  debit_not_authorized: "debit_not_authorized",
  incorrect_account_details: "incorrect_account_details",
  insufficient_funds: "insufficient_funds",
};

/** Motif Stripe normalisé ; un motif inconnu est conservé tel quel (slug) pour revue humaine. */
export function normalizeReason(raw: string): string {
  const s = slug(raw);
  if (s === "") return "inconnu";
  return REASON_ALIASES[s] ?? s;
}
