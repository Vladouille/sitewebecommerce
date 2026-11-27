import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAX_CSV_BYTES, parseDisputesCsv } from "@/lib/audit/parse";

const fixture = readFileSync(new URL("./fixtures/export-synthetique.csv", import.meta.url), "utf8");

describe("parseDisputesCsv", () => {
  const result = parseDisputesCsv(fixture);

  it("garde les lignes valides et rejette les autres avec un motif", () => {
    expect(result.disputes.map((d) => d.id)).toEqual([
      "dp_001", "dp_002", "dp_003", "dp_004", "dp_005", "dp_006", "dp_007", "dp_008",
    ]);
    expect(result.rejected).toEqual([
      { line: 9, motif: "Litige en double, ignoré." },
      { line: 10, motif: "Identifiant du litige manquant." },
      { line: 11, motif: "Montant illisible." },
    ]);
  });

  it("RGPD : aucune donnée personnelle d'élève ne sort de l'analyseur", () => {
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/@example\.com/);
    expect(serialized).not.toMatch(/Exemple/);
    expect(serialized).not.toMatch(/203\.0\.113/);
    expect(result.ignoredColumnCount).toBe(3);
    for (const d of result.disputes) {
      expect(Object.keys(d).sort()).toEqual(
        ["amountCents", "createdAt", "currency", "evidenceDueBy", "id", "network", "reason", "status"],
      );
    }
  });

  it("convertit les champs", () => {
    expect(result.disputes[1]).toMatchObject({
      amountCents: 199700,
      currency: "eur",
      network: "mastercard",
      reason: "product_not_received",
      status: "won",
    });
    expect(result.disputes[5]?.network).toBe("inconnu");
  });

  it("accepte un export au format français (point-virgule, BOM, montants à virgule)", () => {
    const csv = "﻿Identifiant;Montant;Motif;Statut;Marque de la carte\ndp_x;1 234,50;Frauduleux;Perdu;CB\n";
    const r = parseDisputesCsv(csv);
    expect(r.missingRequiredColumns).toEqual([]);
    expect(r.disputes[0]).toMatchObject({ amountCents: 123450, reason: "fraudulent", status: "lost", network: "cartes_bancaires" });
    expect(r.missingOptionalColumns).toEqual(["currency", "created", "evidenceDue"]);
  });

  it("signale clairement un fichier sans les colonnes obligatoires", () => {
    const r = parseDisputesCsv("Nom,Email\nJean,jean@example.com\n");
    expect(r.missingRequiredColumns).toEqual(["id", "amount", "reason", "status"]);
    expect(r.disputes).toEqual([]);
  });

  it("signale l'absence de la colonne réseau (CB indétectable)", () => {
    const r = parseDisputesCsv("id,amount,reason,status\ndp_1,10.00,fraudulent,lost\n");
    expect(r.missingOptionalColumns).toContain("network");
    expect(r.disputes[0]?.network).toBe("inconnu");
  });

  it("refuse un fichier trop volumineux", () => {
    const r = parseDisputesCsv("x".repeat(MAX_CSV_BYTES + 1));
    expect(r.disputes).toEqual([]);
    expect(r.rejected[0]?.motif).toMatch(/trop volumineux/);
  });

  it("ne plante pas sur un fichier vide", () => {
    const r = parseDisputesCsv("");
    expect(r.disputes).toEqual([]);
    expect(r.missingRequiredColumns.length).toBeGreaterThan(0);
  });
});
