#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const TIME_ZONE = "Asia/Shanghai";
const DEFAULT_PROJECT = "bazifortune";
const DEFAULT_INSTANCE = "instance-20260422-173030";
const DEFAULT_ZONE = "us-west2-c";
const DEFAULT_REMOTE_FILE = "/home/yishun/logs/yishun-analytics.jsonl";
const DEFAULT_TIMEOUT_MS = 30_000;

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

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const dateFlagIndex = rawArgs.indexOf("--date");
  const dateArg = dateFlagIndex >= 0 ? rawArgs[dateFlagIndex + 1] : rawArgs.find((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
  const timeoutArg = rawArgs.find((item) => item.startsWith("--timeout-ms="));
  const timeoutMs = Number(
    timeoutArg
      ? timeoutArg.slice("--timeout-ms=".length)
      : process.env.YISHUN_PRODUCTION_ANALYTICS_FILE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS,
  );

  return {
    date: process.env.REPORT_DATE || (/^\d{4}-\d{2}-\d{2}$/.test(dateArg || "") ? dateArg : cstDate()),
    project: process.env.YISHUN_GCP_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      DEFAULT_PROJECT,
    instance: process.env.YISHUN_GCP_INSTANCE || DEFAULT_INSTANCE,
    zone: process.env.YISHUN_GCP_ZONE || DEFAULT_ZONE,
    remoteFile: process.env.YISHUN_PRODUCTION_ANALYTICS_FILE || DEFAULT_REMOTE_FILE,
    outDir: process.env.YISHUN_ANALYTICS_EXPORT_DIR || path.join("output", "yishun-analytics"),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    allowEmpty: args.has("--allow-empty") || process.env.YISHUN_GCP_ANALYTICS_ALLOW_EMPTY === "1",
  };
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function eventDate(event) {
  const parsed = new Date(event.ts || event.timestamp || Date.now());
  return Number.isNaN(parsed.getTime()) ? cstDate() : cstDate(parsed);
}

function parseJsonMaybe(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function analyticsEventFromRecord(record) {
  if (!isRecord(record)) return null;
  if (typeof record.event === "string") return record;
  if (
    (record.type === "yishun_analytics_event" || record.type === "yishun_server_analytics_event") &&
    isRecord(record.event)
  ) {
    return record.event;
  }
  return null;
}

function parseAnalyticsFile(text, reportDate) {
  const events = [];
  let rawLineCount = 0;
  let parsedRows = 0;
  let malformedRows = 0;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    rawLineCount += 1;
    const record = parseJsonMaybe(line);
    if (!record) {
      malformedRows += 1;
      continue;
    }
    parsedRows += 1;
    const event = analyticsEventFromRecord(record);
    if (event && eventDate(event) === reportDate) events.push(event);
  }

  return { events, rawLineCount, parsedRows, malformedRows };
}

async function main() {
  const config = parseArgs();
  const remoteCommand = [
    "sudo -n -u yishun sh -lc",
    shellQuote(`if test -f ${shellQuote(config.remoteFile)}; then cat ${shellQuote(config.remoteFile)}; fi`),
  ].join(" ");

  const { stdout } = await execFileAsync("gcloud", [
    "compute",
    "ssh",
    config.instance,
    "--zone",
    config.zone,
    "--project",
    config.project,
    "--command",
    remoteCommand,
  ], {
    maxBuffer: 50 * 1024 * 1024,
    timeout: config.timeoutMs,
    killSignal: "SIGTERM",
  });

  const parsed = parseAnalyticsFile(stdout || "", config.date);
  if (parsed.events.length === 0 && !config.allowEmpty) {
    throw new Error(`No YiShun production file analytics events were found for ${config.date}. Re-run with --allow-empty to write an empty export.`);
  }

  await mkdir(config.outDir, { recursive: true });
  const baseName = `yishun-analytics-production-file-${config.date}`;
  const outputPath = path.join(config.outDir, `${baseName}.jsonl`);
  const metaPath = path.join(config.outDir, `${baseName}.meta.json`);

  await writeFile(outputPath, parsed.events.map((event) => JSON.stringify(event)).join("\n") + (parsed.events.length ? "\n" : ""));
  await writeFile(metaPath, JSON.stringify({
    sourceKind: "production_file",
    date: config.date,
    project: config.project,
    instance: config.instance,
    zone: config.zone,
    remoteFile: config.remoteFile,
    rawLineCount: parsed.rawLineCount,
    parsedRows: parsed.parsedRows,
    malformedRows: parsed.malformedRows,
    eventCount: parsed.events.length,
    outputPath,
    allowEmpty: config.allowEmpty,
    timeoutMs: config.timeoutMs,
    generatedAt: new Date().toISOString(),
  }, null, 2));

  console.log(JSON.stringify({
    ok: true,
    date: config.date,
    project: config.project,
    instance: config.instance,
    zone: config.zone,
    remoteFile: config.remoteFile,
    rawLineCount: parsed.rawLineCount,
    parsedRows: parsed.parsedRows,
    malformedRows: parsed.malformedRows,
    eventCount: parsed.events.length,
    outputPath,
    metaPath,
    timeoutMs: config.timeoutMs,
  }, null, 2));
}

main().catch((error) => {
  if (error?.killed || error?.signal === "SIGTERM") {
    console.error(`production analytics file export timed out after ${parseArgs().timeoutMs}ms`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
});
