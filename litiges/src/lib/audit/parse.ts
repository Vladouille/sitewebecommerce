import Papa from "papaparse";
import {
  normalizeHeader,
  normalizeNetwork,
  normalizeReason,
  normalizeStatus,
  parseAmountToCents,
  parseDate,
} from "./normalize";
import type { CleanDispute, ParseResult, RejectedRow } from "./types";

/** Taille maximale acceptée : 5 Mo (un export de litiges fait rarement plus de 200 Ko). */
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
/** Au-delà, on refuse : ce n'est plus un export de litiges d'un petit vendeur. */
export const MAX_ROWS = 20_000;

type Field = "id" | "amount" | "currency" | "created" | "reason" | "status" | "evidenceDue" | "network";

/**
 * Noms de colonnes reconnus (après normalisation : minuscules, sans accents,
 * sans parenthèses). LISTE EN LISTE BLANCHE : toute autre colonne (nom, email,
 * adresse, IP de l'élève…) est ignorée et n'est jamais lue.
 * À AJUSTER dès qu'un vrai export Stripe est disponible.
 */
const COLUMN_ALIASES: Record<Field, readonly string[]> = {
  id: ["id", "dispute id", "identifiant", "id du litige"],
  amount: ["amount", "disputed amount", "dispute amount", "montant", "montant conteste"],
  currency: ["currency", "devise"],
  created: ["created", "date", "created at", "date de creation", "cree le"],
  reason: ["reason", "dispute reason", "motif", "raison"],
  status: ["status", "dispute status", "statut"],
  evidenceDue: ["evidence due by", "due by", "evidence due", "date limite", "echeance", "a repondre avant le"],
  network: [
    "card brand",
    "brand",
    "network",
    "card network",
    "payment method details card brand",
    "payment method details card network",
    "marque de la carte",
    "reseau",
  ],
};

const REQUIRED: readonly Field[] = ["id", "amount", "reason", "status"];

function mapColumns(headers: string[]): { map: Partial<Record<Field, string>>; ignored: number } {
  const map: Partial<Record<Field, string>> = {};
  let used = 0;
  for (const header of headers) {
    const norm = normalizeHeader(header);
    const field = (Object.keys(COLUMN_ALIASES) as Field[]).find(
      (f) => map[f] === undefined && COLUMN_ALIASES[f].includes(norm),
    );
    if (field) {
      map[field] = header;
      used++;
    }
  }
  return { map, ignored: headers.length - used };
}

/**
 * Lit un export CSV de litiges Stripe et ne garde QUE les champs utiles au calcul.
 * Fonction pure : ne stocke rien, ne journalise rien.
 */
export function parseDisputesCsv(csv: string): ParseResult {
  const empty: ParseResult = {
    disputes: [],
    rejected: [],
    missingRequiredColumns: [],
    missingOptionalColumns: [],
    ignoredColumnCount: 0,
  };

  if (new TextEncoder().encode(csv).length > MAX_CSV_BYTES) {
    return { ...empty, rejected: [{ line: 0, motif: "Fichier trop volumineux (5 Mo maximum)." }] };
  }

  const parsed = Papa.parse<Record<string, string>>(csv.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", ";", "\t"],
    transform: (v) => v.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const { map, ignored } = mapColumns(headers);
  const missingRequiredColumns = REQUIRED.filter((f) => map[f] === undefined);
  const missingOptionalColumns = (["currency", "created", "evidenceDue", "network"] as const).filter(
    (f) => map[f] === undefined,
  );

  if (missingRequiredColumns.length > 0) {
    return { ...empty, missingRequiredColumns, missingOptionalColumns, ignoredColumnCount: ignored };
  }
  if (parsed.data.length > MAX_ROWS) {
    return {
      ...empty,
      missingOptionalColumns,
      ignoredColumnCount: ignored,
      rejected: [{ line: 0, motif: `Trop de lignes (${MAX_ROWS} maximum).` }],
    };
  }

  const get = (row: Record<string, string>, f: Field): string => {
    const col = map[f];
    return col === undefined ? "" : (row[col] ?? "");
  };

  const disputes: CleanDispute[] = [];
  const rejected: RejectedRow[] = [];
  const seen = new Set<string>();

  parsed.data.forEach((row, index) => {
    const line = index + 1;
    const id = get(row, "id");
    if (id === "") return rejected.push({ line, motif: "Identifiant du litige manquant." });
    if (seen.has(id)) return rejected.push({ line, motif: "Litige en double, ignoré." });

    const amountCents = parseAmountToCents(get(row, "amount"));
    if (amountCents === null) return rejected.push({ line, motif: "Montant illisible." });

    seen.add(id);
    disputes.push({
      id,
      amountCents,
      currency: (get(row, "currency") || "eur").toLowerCase(),
      createdAt: parseDate(get(row, "created")),
      reason: normalizeReason(get(row, "reason")),
      status: normalizeStatus(get(row, "status")),
      evidenceDueBy: parseDate(get(row, "evidenceDue")),
      network: normalizeNetwork(get(row, "network")),
    });
  });

  return {
    disputes,
    rejected,
    missingRequiredColumns: [],
    missingOptionalColumns,
    ignoredColumnCount: ignored,
  };
}
