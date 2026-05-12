import type { Prisma } from "@prisma/client";

export type ConsultationResponseJson = Prisma.JsonValue;

export function normalizeConsultationResponse(
  value: Prisma.JsonValue | string | null
): Prisma.JsonValue | null {
  if (value === null) return null;

  // Backward compatibility: older app code stored JSON as a string. PostgreSQL JSONB
  // rows should already arrive as objects, but parsing strings keeps legacy rows safe.
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Prisma.JsonValue;
    } catch {
      return value;
    }
  }

  return value;
}

export function summarizeConsultationResponse(
  value: Prisma.JsonValue | string | null
): string | null {
  const normalized = normalizeConsultationResponse(value);
  if (normalized === null) return null;

  if (typeof normalized === "string") return normalized;

  if (typeof normalized === "object" && !Array.isArray(normalized)) {
    const record = normalized as Record<string, unknown>;
    const interpretation = record.interpretation;
    if (typeof interpretation === "string") return interpretation;
  }

  return JSON.stringify(normalized);
}
