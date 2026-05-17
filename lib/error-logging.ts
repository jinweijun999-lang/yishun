export type ErrorLogScope = "client" | "server";

export type SafeErrorLogPayload = {
  scope: ErrorLogScope;
  route?: string;
  message: string;
  code?: string;
  traceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type CrashAdapterPayload = SafeErrorLogPayload & {
  level?: "info" | "warning" | "error";
  release?: string;
};

export type CrashAdapterResult = {
  ok: true;
  provider: "local-safe" | "sentry";
  sent: false;
  event: ReturnType<typeof buildSafeErrorLog> & { level: "info" | "warning" | "error"; release: string };
  requiredEnv: string[];
};

const SENSITIVE_KEYS = /email|phone|token|secret|password|birth|question|name|address|cookie|authorization|ip|session/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LONG_NUMBER_RE = /\b\d{8,}\b/g;
const ISO_BIRTH_DATE_RE = /\b(19|20)\d{2}-\d{2}-\d{2}\b/g;
const TOKEN_RE = /\b(?:sk|pk|sess|cs|tok|whsec)_[A-Za-z0-9_\-]{8,}\b/g;

export function redactErrorMessage(message: string) {
  return message
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(TOKEN_RE, "[redacted-token]")
    .replace(ISO_BIRTH_DATE_RE, "[redacted-date]")
    .replace(LONG_NUMBER_RE, "[redacted-number]")
    .slice(0, 180);
}

export function redactErrorMetadata(metadata: Record<string, unknown> = {}) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_KEYS.test(key) ? "[redacted]" : typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null ? value : "[non-scalar]",
    ])
  ) as SafeErrorLogPayload["metadata"];
}

export function buildSafeErrorLog(payload: SafeErrorLogPayload) {
  return {
    scope: payload.scope,
    route: payload.route ?? "unknown",
    message: redactErrorMessage(payload.message),
    code: payload.code ?? "UNCLASSIFIED",
    traceId: payload.traceId ?? `err_${Date.now().toString(36)}`,
    metadata: redactErrorMetadata(payload.metadata ?? {}),
    privacy: "No secrets, cookies, full questions, birth data, or direct identifiers are logged by this V1 adapter.",
  };
}

export async function captureCrashEvent(payload: CrashAdapterPayload): Promise<CrashAdapterResult> {
  const safe = buildSafeErrorLog(payload);
  return {
    ok: true,
    provider: "local-safe",
    sent: false,
    event: {
      ...safe,
      level: payload.level ?? "error",
      release: payload.release ?? "local-v1",
    },
    requiredEnv: ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN", "SENTRY_ENVIRONMENT"],
  };
}

export async function logServerError(payload: SafeErrorLogPayload) {
  const safe = await captureCrashEvent({ ...payload, scope: "server" });
  // Local adapter only: keep logs useful in dev without sending PII to third parties.
  console.error("[YiShunSafeError]", JSON.stringify(safe.event));
  return safe.event;
}

export async function logClientError(payload: Omit<SafeErrorLogPayload, "scope">) {
  try {
    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, scope: "client" }),
    });
  } catch {
    // Do not block the user experience if local error logging is unavailable.
  }
}
