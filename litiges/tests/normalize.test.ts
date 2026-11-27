import { describe, expect, it } from "vitest";
import {
  normalizeHeader,
  normalizeNetwork,
  normalizeReason,
  normalizeStatus,
  parseAmountToCents,
  parseDate,
} from "@/lib/audit/normalize";

describe("parseAmountToCents", () => {
  it.each([
    ["49.00", 4900],
    ["49", 4900],
    ["49,5", 4950],
    ["1,997.00", 199700],
    ["1 997,00", 199700],
    ["1.997,00", 199700],
    ["€497.00", 49700],
    ["497,00 €", 49700],
    ["0.01", 1],
  ])("%s → %i centimes", (raw, cents) => {
    expect(parseAmountToCents(raw)).toBe(cents);
  });

  it.each(["", "abc", "-10.00", "10.001", "1.2.3"])("refuse « %s »", (raw) => {
    expect(parseAmountToCents(raw)).toBeNull();
  });

  it("ne produit jamais d'erreur d'arrondi flottant", () => {
    expect(parseAmountToCents("0.29")).toBe(29);
    expect(parseAmountToCents("1234567.89")).toBe(123456789);
  });
});

describe("parseDate", () => {
  it("lit l'ISO sans fuseau comme UTC", () => {
    expect(parseDate("2026-09-01 10:00:00")?.toISOString()).toBe("2026-09-01T10:00:00.000Z");
  });
  it("lit le format français jj/mm/aaaa", () => {
    expect(parseDate("14/03/2026")?.toISOString()).toBe("2026-03-14T00:00:00.000Z");
  });
  it("lit un timestamp Unix", () => {
    expect(parseDate("1767225600")?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
  it("renvoie null pour vide ou illisible", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate("pas une date")).toBeNull();
  });
});

describe("normalisations", () => {
  it("normalise les en-têtes", () => {
    expect(normalizeHeader("﻿Created (UTC)")).toBe("created");
    expect(normalizeHeader("Marque_de_la_Carte")).toBe("marque de la carte");
  });
  it("reconnaît les réseaux, CB compris", () => {
    expect(normalizeNetwork("Visa")).toBe("visa");
    expect(normalizeNetwork("MasterCard")).toBe("mastercard");
    expect(normalizeNetwork("cartes_bancaires")).toBe("cartes_bancaires");
    expect(normalizeNetwork("CB")).toBe("cartes_bancaires");
    expect(normalizeNetwork("Carte Bancaire")).toBe("cartes_bancaires");
    expect(normalizeNetwork("American Express")).toBe("amex");
    expect(normalizeNetwork("discover")).toBe("autre");
    expect(normalizeNetwork("")).toBe("inconnu");
  });
  it("reconnaît statuts et motifs, anglais ou français", () => {
    expect(normalizeStatus("Needs response")).toBe("needs_response");
    expect(normalizeStatus("Gagné")).toBe("won");
    expect(normalizeStatus("bizarre")).toBe("inconnu");
    expect(normalizeReason("Product not received")).toBe("product_not_received");
    expect(normalizeReason("Frauduleux")).toBe("fraudulent");
    expect(normalizeReason("Motif Nouveau")).toBe("motif_nouveau");
  });
});
