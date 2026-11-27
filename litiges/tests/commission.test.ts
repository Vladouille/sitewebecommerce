import { describe, expect, it } from "vitest";
import { commissionForWonDispute, estimateRecovery } from "@/lib/audit/commission";

describe("commissionForWonDispute (20 %, plafond 300 €)", () => {
  it.each([
    [0, 0],
    [49_700, 9_940], // 497 € → 99,40 €
    [150_000, 30_000], // 1 500 € → pile 300 €
    [199_700, 30_000], // 1 997 € → plafonné à 300 €
    [1_000_000, 30_000],
    [1, 0], // 0,01 € → 0,002 € arrondi à 0
    [3, 1], // 0,03 € → 0,006 € arrondi à 0,01 €
  ])("%i centimes → %i centimes", (amount, expected) => {
    expect(commissionForWonDispute(amount)).toBe(expected);
  });

  it("refuse les montants négatifs ou non entiers", () => {
    expect(() => commissionForWonDispute(-1)).toThrow(RangeError);
    expect(() => commissionForWonDispute(10.5)).toThrow(RangeError);
  });

  it("accepte une configuration différente", () => {
    expect(commissionForWonDispute(100_000, { commissionRate: 0.25, commissionCapCents: 10_000 })).toBe(10_000);
  });
});

describe("estimateRecovery", () => {
  it("applique le plafond litige par litige, pas sur le total", () => {
    const e = estimateRecovery([199_700, 49_700], 1);
    expect(e.expectedRecoveredCents).toBe(249_400);
    expect(e.expectedCommissionCents).toBe(30_000 + 9_940);
    expect(e.expectedNetForClientCents).toBe(249_400 - 39_940);
  });

  it("pondère par le taux de gain fourni", () => {
    const e = estimateRecovery([100_000], 0.5);
    expect(e).toEqual({
      expectedRecoveredCents: 50_000,
      expectedCommissionCents: 10_000,
      expectedNetForClientCents: 40_000,
      winRateHypothesis: 0.5,
    });
  });

  it("refuse un taux hors de [0, 1]", () => {
    expect(() => estimateRecovery([1000], 1.2)).toThrow(RangeError);
    expect(() => estimateRecovery([1000], -0.1)).toThrow(RangeError);
    expect(() => estimateRecovery([1000], Number.NaN)).toThrow(RangeError);
  });

  it("liste vide → zéro", () => {
    expect(estimateRecovery([], 0.4).expectedRecoveredCents).toBe(0);
  });
});
