#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_BASE_URL = "https://11263.com";
const DEFAULT_PROJECT = "bazifortune";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_WAIT_MS = 90_000;
const DEFAULT_POLL_MS = 10_000;
const DEFAULT_EVIDENCE_DIR = "reports/evidence";
const EVENT_NAME = "ops_analytics_probe";

function timestampLabel(value = new Date()) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function defaultJsonOut(startedAt) {
  return path.join(DEFAULT_EVIDENCE_DIR, `yishun-analytics-pipeline-probe-${timestampLabel(startedAt)}.json`);
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs() {
  const config = {
    baseUrl: process.env.YISHUN_PRODUCTION_BASE_URL || DEFAULT_BASE_URL,
    project: process.env.YISHUN_GCP_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      DEFAULT_PROJECT,
    timeoutMs: parseNumber(process.env.YISHUN_ANALYTICS_PROBE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    waitMs: parseNumber(process.env.YISHUN_ANALYTICS_PROBE_WAIT_MS, DEFAULT_WAIT_MS),
    pollMs: parseNumber(process.env.YISHUN_ANALYTICS_PROBE_POLL_MS, DEFAULT_POLL_MS),
    jsonOut: process.env.YISHUN_ANALYTICS_PROBE_OUT || "",
  };

  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("--base-url=")) config.baseUrl = arg.slice("--base-url=".length);
    if (arg.startsWith("--project=")) config.project = arg.slice("--project=".length);
    if (arg.startsWith("--timeout-ms=")) config.timeoutMs = parseNumber(arg.slice("--timeout-ms=".length), DEFAULT_TIMEOUT_MS);
    if (arg.startsWith("--wait-ms=")) config.waitMs = parseNumber(arg.slice("--wait-ms=".length), DEFAULT_WAIT_MS);
    if (arg.startsWith("--poll-ms=")) config.pollMs = parseNumber(arg.slice("--poll-ms=".length), DEFAULT_POLL_MS);
    if (arg.startsWith("--json-out=")) config.jsonOut = arg.slice("--json-out=".length);
  }

  return {
    ...config,
    baseUrl: config.baseUrl.replace(/\/+$/, ""),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "user-agent": "yishun-analytics-pipeline-probe/1.0",
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => null);
    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      body,
    };
  } finally {
    clearTimeout(timer);
  }
}

function logLiteral(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function logFilter({ probeId, startedAt }) {
  const start = new Date(startedAt.getTime() - 2 * 60 * 1000).toISOString();
  const safeProbeId = logLiteral(probeId);
  return [
    `timestamp >= "${start}"`,
    "(",
    `textPayload:"${safeProbeId}"`,
    "OR",
    `jsonPayload.message:"${safeProbeId}"`,
    "OR",
    `jsonPayload.event.properties.probe_id="${safeProbeId}"`,
    "OR",
    `jsonPayload.event.event="${EVENT_NAME}"`,
    ")",
  ].join(" ");
}

function summarizeError(error) {
  return {
    message: error instanceof Error ? error.message : String(error),
    code: error?.code ?? null,
    signal: error?.signal || null,
    stderr: String(error?.stderr || "").slice(-1200),
  };
}

async function readProbeLogs({ project, probeId, startedAt, timeoutMs }) {
  const filter = logFilter({ probeId, startedAt });
  const { stdout } = await execFileAsync("gcloud", [
    "logging",
    "read",
    filter,
    "--project",
    project,
    "--format",
    "json",
    "--limit",
    "10",
  ], {
    maxBuffer: 10 * 1024 * 1024,
    timeout: timeoutMs,
    killSignal: "SIGTERM",
  });

  const entries = JSON.parse(stdout || "[]");
  if (!Array.isArray(entries)) throw new Error("gcloud logging read did not return a JSON array");
  return { filter, entries };
}

async function writeEvidence(filePath, payload) {
  if (!filePath) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const config = parseArgs();
  const startedAt = new Date();
  const jsonOut = config.jsonOut || defaultJsonOut(startedAt);
  const probeId = `ops_${timestampLabel(startedAt)}_${Math.random().toString(36).slice(2, 8)}`;
  const endpoint = `${config.baseUrl}/api/events`;
  const payload = {
    event: EVENT_NAME,
    anonymous_id: `ops_probe_${probeId}`,
    source: "ops_probe",
    ts: startedAt.toISOString(),
    properties: {
      product_id: "yishun",
      anonymous_id: `ops_probe_${probeId}`,
      session_id: probeId,
      utm_source: "ops_probe",
      utm_medium: "automation",
      utm_campaign: "analytics_pipeline_verification",
      country: "unknown",
      locale: "ops",
      device: "server",
      page: "/ops/analytics-probe",
      variant: "ops",
      probe_id: probeId,
    },
  };

  const ingest = await fetchWithTimeout(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  }, config.timeoutMs);

  if (!ingest.ok || ingest.body?.accepted !== 1) {
    throw new Error(`Analytics ingest probe failed: status=${ingest.status} accepted=${ingest.body?.accepted ?? "unknown"}`);
  }

  const deadline = Date.now() + config.waitMs;
  let latestLogRead = null;
  let latestLogError = null;
  while (Date.now() <= deadline) {
    try {
      latestLogRead = await readProbeLogs({
        project: config.project,
        probeId,
        startedAt,
        timeoutMs: config.timeoutMs,
      });
      latestLogError = null;
      if (latestLogRead.entries.length > 0) break;
    } catch (error) {
      latestLogError = summarizeError(error);
    }
    await sleep(config.pollMs);
  }

  const ok = Boolean(latestLogRead?.entries.length);
  const evidence = {
    ok,
    baseUrl: config.baseUrl,
    endpoint,
    project: config.project,
    probeId,
    event: EVENT_NAME,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    waitMs: config.waitMs,
    pollMs: config.pollMs,
    ingest: {
      status: ingest.status,
      latencyMs: ingest.latencyMs,
      accepted: ingest.body?.accepted ?? null,
      dropped: ingest.body?.dropped ?? null,
    },
    cloudLogging: {
      observed: ok,
      entryCount: latestLogRead?.entries.length || 0,
      filter: latestLogRead?.filter || logFilter({ probeId, startedAt }),
      firstEntryTimestamp: latestLogRead?.entries[0]?.timestamp || null,
      latestReadError: latestLogError,
    },
    evidencePath: jsonOut,
  };

  await writeEvidence(jsonOut, evidence);
  console.log(JSON.stringify(evidence, null, 2));

  if (!ok) {
    throw new Error("Analytics ingest accepted the probe, but Cloud Logging did not expose the probe event before the timeout.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
