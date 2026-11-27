/**
 * Paramètres métier modifiables sans toucher à la logique.
 * Tous les montants sont en CENTIMES (entiers) pour éviter les erreurs d'arrondi.
 */
export interface BusinessConfig {
  commissionRate: number;
  commissionCapCents: number;
  minDefendableAmountCents: number;
  nonDefendableReasons: readonly string[];
}

export const BUSINESS_CONFIG: Readonly<BusinessConfig> = {
  /** Commission prélevée sur chaque litige GAGNÉ (20 %). */
  commissionRate: 0.2,
  /** Plafond de commission par litige gagné : 300 €. */
  commissionCapCents: 30_000,
  /**
   * En dessous de ce montant, on ne conseille pas de contester :
   * les frais de contestation Stripe (perdus en cas d'échec) mangent le gain.
   * À ajuster quand le montant exact des frais Stripe en France sera vérifié.
   */
  minDefendableAmountCents: 3_000,
  /**
   * Motifs qu'on ne conteste pas : problèmes bancaires ou de prélèvement
   * où aucune preuve de livraison de la formation ne change l'issue.
   */
  nonDefendableReasons: [
    "bank_cannot_process",
    "check_returned",
    "debit_not_authorized",
    "incorrect_account_details",
    "insufficient_funds",
  ],
};
