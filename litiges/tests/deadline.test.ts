import { describe, expect, it } from "vitest";
import { daysUntil, urgencyFor } from "@/lib/audit/deadline";

const now = new Date("2026-11-27T12:00:00Z");
const at = (iso: string) => new Date(iso);

describe("daysUntil", () => {
  it("arrondit au jour supérieur", () => {
    expect(daysUntil(at("2026-11-27T13:00:00Z"), now)).toBe(1);
    expect(daysUntil(at("2026-11-29T12:00:00Z"), now)).toBe(2);
    expect(daysUntil(at("2026-11-29T12:00:01Z"), now)).toBe(3);
  });
  it("est négatif après l'échéance", () => {
    expect(daysUntil(at("2026-11-26T12:00:00Z"), now)).toBe(-1);
  });
});

describe("urgencyFor", () => {
  it.each([
    ["2026-11-27T11:59:59Z", "expire"],
    ["2026-11-27T12:00:00Z", "expire"],
    ["2026-11-30T12:00:00Z", "critique"],
    ["2026-12-04T12:00:00Z", "urgent"],
    ["2026-12-04T12:00:01Z", "normal"],
  ])("échéance %s → %s", (due, expected) => {
    expect(urgencyFor(at(due), now)).toBe(expected);
  });
});
