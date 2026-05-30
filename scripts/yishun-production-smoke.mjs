#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://11263.com";
const DEFAULT_TIMEOUT_MS = 10000;

function parseArgs() {
  const config = {
    baseUrl: process.env.YISHUN_PRODUCTION_BASE_URL || DEFAULT_BASE_URL,
    expectedSha: process.env.YISHUN_EXPECTED_RELEASE_SHA || process.env.YISHUN_RELEASE_SHA || "",
    timeoutMs: Number(process.env.YISHUN_PRODUCTION_SMOKE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  };

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--base-url=")) config.baseUrl = arg.slice("--base-url=".length);
    if (arg.startsWith("--expect-sha=")) config.expectedSha = arg.slice("--expect-sha=".length);
    if (arg.startsWith("--timeout-ms=")) config.timeoutMs = Number(arg.slice("--timeout-ms=".length));
  }

  return {
    ...config,
    baseUrl: config.baseUrl.replace(/\/+$/, ""),
    timeoutMs: Number.isFinite(config.timeoutMs) && config.timeoutMs > 0 ? config.timeoutMs : DEFAULT_TIMEOUT_MS,
  };
}

async function fetchWithTimeout(url, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
      headers: {
        "user-agent": "yishun-production-smoke/1.0",
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

async function main() {
  const config = parseArgs();
  const pages = [
    ["/", "YiShun"],
    ["/reading/start", "YiShun"],
    ["/membership", "YiShun"],
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
  ];

  const health = await checkHealth(config);
  const pageResults = [];
  for (const [route, requiredText] of pages) {
    pageResults.push(await checkPage(config, route, requiredText));
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl: config.baseUrl,
    checkedAt: new Date().toISOString(),
    health,
    pages: pageResults,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    message: error instanceof Error ? error.message : "Production smoke failed",
    details: error?.details || {},
  }, null, 2));
  process.exit(1);
});
