import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeDisputes, contestabilityOf, phaseOf } from "@/lib/audit/analyze";
import { parseDisputesCsv } from "@/lib/audit/parse";
import type { CleanDispute } from "@/lib/audit/types";

const now = new Date("2026-11-27T12:00:00Z");
const fixture = readFileSync(new URL("./fixtures/export-synthetique.csv", import.meta.url), "utf8");
const analysis = analyzeDisputes(parseDisputesCsv(fixture).disputes, now);
const eur = analysis.currencies.find((c) => c.currency === "eur")!;

const base: CleanDispute = {
  id: "dp_t",
  amountCents: 50_000,
  currency: "eur",
  createdAt: null,
  reason: "fraudulent",
  status: "needs_response",
  evidenceDueBy: null,
  network: "visa",
};

describe("contestabilityOf", () => {
  it("CB n'est jamais contestable, même avec un motif contestable", () => {
    expect(contestabilityOf({ ...base, network: "cartes_bancaires" })).toBe("non_contestable_cb");
  });
  it("écarte les motifs bancaires", () => {
    expect(contestabilityOf({ ...base, reason: "insufficient_funds" })).toBe("non_contestable_motif");
  });
  it("écarte les petits montants (frais Stripe > gain)", () => {
    expect(contestabilityOf({ ...base, amountCents: 2_999 })).toBe("montant_trop_faible");
    expect(contestabilityOf({ ...base, amountCents: 3_000 })).toBe("contestable");
  });
  it("réseau inconnu = à vérifier, jamais compté comme contestable", () => {
    expect(contestabilityOf({ ...base, network: "inconnu" })).toBe("reseau_a_verifier");
  });
});

describe("phaseOf", () => {
  it("classe les statuts Stripe", () => {
    expect(phaseOf("needs_response")).toBe("ouvert");
    expect(phaseOf("warning_needs_response")).toBe("ouvert");
    expect(phaseOf("under_review")).toBe("en_examen");
    expect(phaseOf("won")).toBe("clos");
    expect(phaseOf("prevented")).toBe("clos");
    expect(phaseOf("inconnu")).toBe("inconnu");
  });
});

describe("analyzeDisputes (export synthétique)", () => {
  it("sépare les devises : jamais d'addition euros + dollars", () => {
    expect(analysis.disputeCount).toBe(8);
    expect(analysis.currencies.map((c) => c.currency)).toEqual(["eur", "usd"]);
    expect(eur.total).toEqual({ count: 7, amountCents: 49_700 + 199_700 + 29_700 + 99_700 + 2_000 + 400_000 + 15_000 });
  });

  it("répartit par réseau", () => {
    expect(eur.byNetwork.visa).toEqual({ count: 3, amountCents: 49_700 + 99_700 + 2_000 });
    expect(eur.byNetwork.cartes_bancaires).toEqual({ count: 1, amountCents: 29_700 });
    expect(eur.byNetwork.inconnu.count).toBe(1);
  });

  it("perdus contestables = argent du PASSÉ (hors CB et motifs bancaires)", () => {
    expect(eur.lost).toEqual({ count: 3, amountCents: 49_700 + 29_700 + 15_000 });
    expect(eur.lostButContestable).toEqual({ count: 1, amountCents: 49_700 });
  });

  it("litiges ouverts triés par échéance la plus proche", () => {
    expect(eur.openDisputes.map((d) => [d.id, d.daysLeft, d.urgency, d.contestability])).toEqual([
      ["dp_006", 2, "critique", "reseau_a_verifier"],
      ["dp_004", 6, "urgent", "contestable"],
      ["dp_005", 14, "normal", "montant_trop_faible"],
    ]);
  });

  it("taux de gain historique = gagnés / décidés", () => {
    expect(eur.observedWinRate).toBeCloseTo(1 / 4);
    const usd = analysis.currencies.find((c) => c.currency === "usd")!;
    expect(usd.observedWinRate).toBeNull();
  });

  it("motifs triés par montant décroissant", () => {
    expect(eur.byReason[0]).toEqual({ reason: "general", count: 1, amountCents: 400_000 });
  });

  it("aucun litige → aucune devise", () => {
    expect(analyzeDisputes([], now).currencies).toEqual([]);
  });
});
