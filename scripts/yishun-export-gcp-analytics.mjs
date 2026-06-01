#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const TIME_ZONE = "Asia/Shanghai";
const DEFAULT_PROJECT = "bazifortune";
const DEFAULT_GCLOUD_TIMEOUT_MS = 60_000;

function cstDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function utcBoundsForCstDate(date) {
  const start = new Date(`${date}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const dateArg = rawArgs.find((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
  const timeoutArg = rawArgs.find((item) => item.startsWith("--timeout-ms="));
  const timeoutMs = Number(
    timeoutArg
      ? timeoutArg.slice("--timeout-ms=".length)
      : process.env.YISHUN_GCP_ANALYTICS_TIMEOUT_MS || DEFAULT_GCLOUD_TIMEOUT_MS,
  );

  return {
    date: process.env.REPORT_DATE || dateArg || cstDate(),
    project: process.env.YISHUN_GCP_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      DEFAULT_PROJECT,
    outDir: process.env.YISHUN_ANALYTICS_EXPORT_DIR || path.join("output", "yishun-analytics"),
    limit: process.env.YISHUN_GCP_ANALYTICS_LIMIT || "5000",
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_GCLOUD_TIMEOUT_MS,
    allowEmpty: args.has("--allow-empty") || process.env.YISHUN_GCP_ANALYTICS_ALLOW_EMPTY === "1",
  };
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonMaybe(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd <= jsonStart) return null;
    try {
      return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
    } catch {
      return null;
    }
  }
}

function analyticsEventFromLogEntry(record) {
  if (!isRecord(record)) return null;
  if (typeof record.event === "string") return record;

  if (
    (record.type === "yishun_analytics_event" || record.type === "yishun_server_analytics_event") &&
    isRecord(record.event)
  ) {
    return record.event;
  }

  if (isRecord(record.jsonPayload)) {
    const nested = analyticsEventFromLogEntry(record.jsonPayload);
    if (nested) return nested;
  }

  for (const key of ["textPayload", "message", "log"]) {
    const parsed = parseJsonMaybe(record[key]);
    const nested = analyticsEventFromLogEntry(parsed);
    if (nested) return nested;
  }

  return null;
}

async function main() {
  const config = parseArgs();
  const { start, end } = utcBoundsForCstDate(config.date);
  const filter = [
    `timestamp >= "${start}"`,
    `timestamp < "${end}"`,
    "(",
    'jsonPayload.type="yishun_analytics_event"',
    "OR",
    'jsonPayload.type="yishun_server_analytics_event"',
    "OR",
    'textPayload:"yishun_analytics_event"',
    "OR",
    'textPayload:"yishun_server_analytics_event"',
    ")",
  ].join(" ");

  let stdout;
  try {
    ({ stdout } = await execFileAsync("gcloud", [
      "logging",
      "read",
      filter,
      "--project",
      config.project,
      "--format",
      "json",
      "--limit",
      config.limit,
    ], {
      maxBuffer: 20 * 1024 * 1024,
      timeout: config.timeoutMs,
      killSignal: "SIGTERM",
    }));
  } catch (error) {
    if (error?.killed || error?.signal === "SIGTERM") {
      throw new Error(`gcloud logging read timed out after ${config.timeoutMs}ms`);
    }
    throw error;
  }

  const entries = JSON.parse(stdout || "[]");
  if (!Array.isArray(entries)) throw new Error("gcloud logging read did not return a JSON array");

  const events = entries
    .map(analyticsEventFromLogEntry)
    .filter((event) => isRecord(event) && typeof event.event === "string");

  if (events.length === 0 && !config.allowEmpty) {
    throw new Error("No YiShun analytics events were found in Cloud Logging. Re-run with --allow-empty to write an empty export.");
  }

  await mkdir(config.outDir, { recursive: true });
  const baseName = `yishun-analytics-gcp-${config.date}`;
  const outputPath = path.join(config.outDir, `${baseName}.jsonl`);
  const metaPath = path.join(config.outDir, `${baseName}.meta.json`);

  await writeFile(outputPath, events.map((event) => JSON.stringify(event)).join("\n") + (events.length ? "\n" : ""));
  await writeFile(metaPath, JSON.stringify({
    sourceKind: "cloud_logging",
    date: config.date,
    project: config.project,
    start,
    end,
    filter,
    entryCount: entries.length,
    eventCount: events.length,
    outputPath,
    allowEmpty: config.allowEmpty,
    timeoutMs: config.timeoutMs,
    generatedAt: new Date().toISOString(),
  }, null, 2));

  console.log(JSON.stringify({
    ok: true,
    date: config.date,
    project: config.project,
    entryCount: entries.length,
    eventCount: events.length,
    outputPath,
    metaPath,
    timeoutMs: config.timeoutMs,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
