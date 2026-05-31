#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "https://11263.com";
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_EVIDENCE_DIR = "reports/evidence";

function timestampLabel() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sanitizeLabel(label) {
  return String(label || "")
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function defaultJsonOut(label) {
  const safeLabel = sanitizeLabel(label) || `production-smoke-${timestampLabel()}`;
  return path.join(DEFAULT_EVIDENCE_DIR, `yishun-production-smoke-${safeLabel}.json`);
}

function parseArgs() {
  const config = {
    baseUrl: process.env.YISHUN_PRODUCTION_BASE_URL || DEFAULT_BASE_URL,
    expectedSha: process.env.YISHUN_EXPECTED_RELEASE_SHA || process.env.YISHUN_RELEASE_SHA || "",
    timeoutMs: Number(process.env.YISHUN_PRODUCTION_SMOKE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    jsonOut: process.env.YISHUN_PRODUCTION_SMOKE_OUT || "",
    label: process.env.YISHUN_PRODUCTION_SMOKE_LABEL || "",
    analyticsProbe: process.env.YISHUN_PRODUCTION_ANALYTICS_PROBE === "1",
  };

  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("--base-url=")) config.baseUrl = arg.slice("--base-url=".length);
    if (arg.startsWith("--expect-sha=")) config.expectedSha = arg.slice("--expect-sha=".length);
    if (arg.startsWith("--timeout-ms=")) config.timeoutMs = Number(arg.slice("--timeout-ms=".length));
    if (arg.startsWith("--json-out=")) config.jsonOut = arg.slice("--json-out=".length);
    if (arg.startsWith("--label=")) config.label = arg.slice("--label=".length);
    if (arg === "--label") config.label = args[index + 1] || "";
    if (arg === "--analytics-probe") config.analyticsProbe = true;
  }

  const label = sanitizeLabel(config.label);

  return {
    ...config,
    baseUrl: config.baseUrl.replace(/\/+$/, ""),
    timeoutMs: Number.isFinite(config.timeoutMs) && config.timeoutMs > 0 ? config.timeoutMs : DEFAULT_TIMEOUT_MS,
    label,
    jsonOut: config.jsonOut || defaultJsonOut(label),
  };
}

async function writeJsonOut(filePath, payload) {
  if (!filePath) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function fetchWithTimeout(url, timeoutMs, options = {}) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
      headers: {
        "user-agent": "yishun-production-smoke/1.0",
        ...(options.headers || {}),
      },
    });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");
    return {
      ok: response.ok,
      status: response.status,
      url: response.url,
      latencyMs: Date.now() - started,
      body,
    };
  } finally {
    clearTimeout(timer);
  }
}

function assert(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

async function checkHealth(config) {
  const result = await fetchWithTimeout(`${config.baseUrl}/api/health`, config.timeoutMs);
  assert(result.ok, "Production health endpoint must return 2xx", { status: result.status, url: result.url });
  assert(result.body && typeof result.body === "object", "Production health endpoint must return JSON");

  const health = result.body;
  assert(health.ok === true, "Production health payload must be ok", { health });
  assert(health.service === "yishun", "Production health service must be yishun", { service: health.service });
  assert(typeof health.version === "string" && health.version.trim(), "Production health must expose a release version");
  assert(health.checks?.database === "ok", "Production database health must be ok", { database: health.checks?.database });
  assert(health.checks?.stripe === "configured", "Production Stripe health must be configured", { stripe: health.checks?.stripe });
  assert(health.checks?.analytics === "configured", "Production analytics health must be configured", { analytics: health.checks?.analytics });

  if (config.expectedSha) {
    assert(
      health.version === config.expectedSha,
      "Production health version must match the expected release SHA",
      { expectedSha: config.expectedSha, actualVersion: health.version },
    );
  }

  return {
    route: "/api/health",
    status: result.status,
    latencyMs: result.latencyMs,
    version: health.version,
    checks: health.checks,
  };
}

async function checkPage(config, route, requiredText) {
  const result = await fetchWithTimeout(`${config.baseUrl}${route}`, config.timeoutMs);
  assert(result.ok, "Production page must return 2xx", { route, status: result.status, url: result.url });
  assert(typeof result.body === "string" && result.body.includes(requiredText), "Production page is missing expected public copy", {
    route,
    requiredText,
  });
  return {
    route,
    status: result.status,
    latencyMs: result.latencyMs,
  };
}

async function checkAnalyticsIngest(config, health) {
  const probeId = `prod-smoke-${Date.now().toString(36)}`;
  const payload = {
    event: "ops_health_ping",
    anonymous_id: `ops_${probeId}`,
    source: "production_smoke",
    ts: new Date().toISOString(),
    properties: {
      product_id: "yishun",
      anonymous_id: `ops_${probeId}`,
      session_id: probeId,
      utm_source: "production_smoke",
      utm_medium: "ops",
      utm_campaign: "analytics_ingest_probe",
      country: "unknown",
      locale: "ops",
      device: "server",
      page: "/api/events",
      variant: "ops",
      release_version: health.version,
    },
  };

  const result = await fetchWithTimeout(`${config.baseUrl}/api/events`, config.timeoutMs, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert(result.ok, "Production analytics ingest endpoint must return 2xx", { status: result.status, url: result.url });
  assert(result.body && typeof result.body === "object", "Production analytics ingest endpoint must return JSON");
  assert(result.body.ok === true, "Production analytics ingest payload must be ok", { body: result.body });
  assert(result.body.accepted === 1, "Production analytics ingest must accept one synthetic ops event", { body: result.body });

  return {
    route: "/api/events",
    status: result.status,
    latencyMs: result.latencyMs,
    accepted: result.body.accepted,
    dropped: result.body.dropped,
    event: payload.event,
    source: payload.source,
    probeId,
  };
}

async function main() {
  const config = parseArgs();
  const pages = [
    ["/", "YiShun"],
    ["/reading/start", "YiShun"],
    ["/membership", "YiShun"],
    ["/status", "YiShun Status"],
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
  ];

  const health = await checkHealth(config);
  const pageResults = [];
  for (const [route, requiredText] of pages) {
    pageResults.push(await checkPage(config, route, requiredText));
  }
  const analyticsIngest = config.analyticsProbe
    ? await checkAnalyticsIngest(config, health)
    : { skipped: true, reason: "analytics probe disabled" };

  const payload = {
    ok: true,
    baseUrl: config.baseUrl,
    checkedAt: new Date().toISOString(),
    evidencePath: config.jsonOut,
    label: config.label,
    health,
    pages: pageResults,
    analyticsIngest,
  };

  await writeJsonOut(config.jsonOut, payload);
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  const config = parseArgs();
  const payload = {
    ok: false,
    baseUrl: config.baseUrl,
    checkedAt: new Date().toISOString(),
    evidencePath: config.jsonOut,
    label: config.label,
    message: error instanceof Error ? error.message : "Production smoke failed",
    details: error?.details || {},
  };

  writeJsonOut(config.jsonOut, payload)
    .catch((writeError) => {
      console.error(JSON.stringify({
        ok: false,
        message: "Failed to write production smoke evidence.",
        details: writeError instanceof Error ? writeError.message : String(writeError),
      }, null, 2));
    })
    .finally(() => {
      console.error(JSON.stringify(payload, null, 2));
      process.exit(1);
    });
});
