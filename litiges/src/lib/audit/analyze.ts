import { BUSINESS_CONFIG, type BusinessConfig } from "./config";
import { daysUntil, urgencyFor, type Urgency } from "./deadline";
import type { CardNetwork, CleanDispute, DisputeStatus } from "./types";

export type Contestability =
  | "contestable"
  | "non_contestable_cb"
  | "non_contestable_motif"
  | "montant_trop_faible"
  | "reseau_a_verifier";

export type Phase = "ouvert" | "en_examen" | "clos" | "inconnu";

const OPEN: readonly DisputeStatus[] = ["needs_response", "warning_needs_response"];
const UNDER_REVIEW: readonly DisputeStatus[] = ["under_review", "warning_under_review"];
const CLOSED: readonly DisputeStatus[] = ["won", "lost", "warning_closed", "prevented"];

export function phaseOf(status: DisputeStatus): Phase {
  if (OPEN.includes(status)) return "ouvert";
  if (UNDER_REVIEW.includes(status)) return "en_examen";
  if (CLOSED.includes(status)) return "clos";
  return "inconnu";
}

type Config = Pick<BusinessConfig, "minDefendableAmountCents" | "nonDefendableReasons">;

/** L'ordre compte : CB d'abord (règle du réseau, sans exception). */
export function contestabilityOf(d: CleanDispute, config: Config = BUSINESS_CONFIG): Contestability {
  if (d.network === "cartes_bancaires") return "non_contestable_cb";
  if (config.nonDefendableReasons.includes(d.reason)) return "non_contestable_motif";
  if (d.amountCents < config.minDefendableAmountCents) return "montant_trop_faible";
  if (d.network === "inconnu") return "reseau_a_verifier";
  return "contestable";
}

export interface Bucket {
  count: number;
  amountCents: number;
}

export interface OpenDispute {
  id: string;
  amountCents: number;
  reason: string;
  contestability: Contestability;
  daysLeft: number | null;
  urgency: Urgency | null;
}

export interface CurrencySummary {
  currency: string;
  total: Bucket;
  byNetwork: Record<CardNetwork, Bucket>;
  /** Trié du plus gros montant au plus petit. */
  byReason: Array<{ reason: string } & Bucket>;
  byPhase: Record<Phase, Bucket>;
  byContestability: Record<Contestability, Bucket>;
  won: Bucket;
  lost: Bucket;
  /**
   * Argument de vente (PASSÉ, non récupérable) : litiges perdus qui étaient contestables.
   */
  lostButContestable: Bucket;
  /** Seul argent réellement récupérable : litiges ouverts, triés par échéance. */
  openDisputes: OpenDispute[];
  /** Taux de gain HISTORIQUE du vendeur (gagnés / décidés), null si aucun litige décidé. */
  observedWinRate: number | null;
}

export interface AuditAnalysis {
  generatedAt: Date;
  disputeCount: number;
  /** Une synthèse par devise : on n'additionne jamais des euros et des dollars. */
  currencies: CurrencySummary[];
}

const bucket = (): Bucket => ({ count: 0, amountCents: 0 });
const add = (b: Bucket, amount: number): void => {
  b.count++;
  b.amountCents += amount;
};

function summarize(currency: string, disputes: CleanDispute[], now: Date, config: Config): CurrencySummary {
  const byNetwork: Record<CardNetwork, Bucket> = {
    visa: bucket(),
    mastercard: bucket(),
    cartes_bancaires: bucket(),
    amex: bucket(),
    autre: bucket(),
    inconnu: bucket(),
  };
  const byPhase: Record<Phase, Bucket> = { ouvert: bucket(), en_examen: bucket(), clos: bucket(), inconnu: bucket() };
  const byContestability: Record<Contestability, Bucket> = {
    contestable: bucket(),
    non_contestable_cb: bucket(),
    non_contestable_motif: bucket(),
    montant_trop_faible: bucket(),
    reseau_a_verifier: bucket(),
  };
  const reasons = new Map<string, Bucket>();
  const total = bucket();
  const won = bucket();
  const lost = bucket();
  const lostButContestable = bucket();
  const openDisputes: OpenDispute[] = [];

  for (const d of disputes) {
    const contestability = contestabilityOf(d, config);
    const phase = phaseOf(d.status);
    add(total, d.amountCents);
    add(byNetwork[d.network], d.amountCents);
    add(byPhase[phase], d.amountCents);
    add(byContestability[contestability], d.amountCents);
    const r = reasons.get(d.reason) ?? bucket();
    add(r, d.amountCents);
    reasons.set(d.reason, r);

    if (d.status === "won") add(won, d.amountCents);
    if (d.status === "lost") {
      add(lost, d.amountCents);
      if (contestability === "contestable") add(lostButContestable, d.amountCents);
    }
    if (phase === "ouvert") {
      openDisputes.push({
        id: d.id,
        amountCents: d.amountCents,
        reason: d.reason,
        contestability,
        daysLeft: d.evidenceDueBy ? daysUntil(d.evidenceDueBy, now) : null,
        urgency: d.evidenceDueBy ? urgencyFor(d.evidenceDueBy, now) : null,
      });
    }
  }

  openDisputes.sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
  const decided = won.count + lost.count;

  return {
    currency,
    total,
    byNetwork,
    byReason: [...reasons.entries()]
      .map(([reason, b]) => ({ reason, ...b }))
      .sort((a, b) => b.amountCents - a.amountCents || a.reason.localeCompare(b.reason)),
    byPhase,
    byContestability,
    won,
    lost,
    lostButContestable,
    openDisputes,
    observedWinRate: decided === 0 ? null : won.count / decided,
  };
}

/** Analyse complète d'un audit. Fonction pure (la date « maintenant » est injectée pour les tests). */
export function analyzeDisputes(
  disputes: readonly CleanDispute[],
  now: Date = new Date(),
  config: Config = BUSINESS_CONFIG,
): AuditAnalysis {
  const groups = new Map<string, CleanDispute[]>();
  for (const d of disputes) {
    const list = groups.get(d.currency) ?? [];
    list.push(d);
    groups.set(d.currency, list);
  }
  const currencies = [...groups.entries()]
    .map(([currency, list]) => summarize(currency, list, now, config))
    .sort((a, b) => b.total.amountCents - a.total.amountCents);
  return { generatedAt: now, disputeCount: disputes.length, currencies };
}
