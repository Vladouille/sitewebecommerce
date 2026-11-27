import { BUSINESS_CONFIG, type BusinessConfig } from "./config";

function assertCents(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new RangeError(`Montant invalide (centimes entiers positifs attendus) : ${amountCents}`);
  }
}

/**
 * Commission sur un litige GAGNÉ : 20 % du montant récupéré, plafonnée à 300 €.
 * Arrondi au centime le plus proche. Un litige perdu = 0 € (ne pas appeler cette fonction).
 */
export function commissionForWonDispute(
  recoveredCents: number,
  config: Pick<BusinessConfig, "commissionRate" | "commissionCapCents"> = BUSINESS_CONFIG,
): number {
  assertCents(recoveredCents);
  return Math.min(Math.round(recoveredCents * config.commissionRate), config.commissionCapCents);
}

export interface RecoveryEstimate {
  /** Montant récupéré attendu si le taux de gain se vérifie. */
  expectedRecoveredCents: number;
  /** Commission attendue (avec plafond appliqué litige par litige). */
  expectedCommissionCents: number;
  /** Ce qui reste au client. */
  expectedNetForClientCents: number;
  /** Rappel : le taux est une HYPOTHÈSE saisie par l'admin, pas une promesse. */
  winRateHypothesis: number;
}

/**
 * Estimation pour une liste de litiges encore contestables.
 * Le taux de gain est fourni par l'admin à chaque rapport : il n'y a volontairement
 * AUCUN taux par défaut dans le code, pour ne jamais présenter un chiffre inventé.
 */
export function estimateRecovery(amountsCents: readonly number[], winRateHypothesis: number): RecoveryEstimate {
  if (!(winRateHypothesis >= 0 && winRateHypothesis <= 1)) {
    throw new RangeError("Le taux de gain doit être compris entre 0 et 1.");
  }
  let recovered = 0;
  let commission = 0;
  for (const amount of amountsCents) {
    recovered += amount * winRateHypothesis;
    commission += commissionForWonDispute(amount) * winRateHypothesis;
  }
  const expectedRecoveredCents = Math.round(recovered);
  const expectedCommissionCents = Math.round(commission);
  return {
    expectedRecoveredCents,
    expectedCommissionCents,
    expectedNetForClientCents: expectedRecoveredCents - expectedCommissionCents,
    winRateHypothesis,
  };
}
