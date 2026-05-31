#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const dateFlagIndex = rawArgs.indexOf("--date");
  const dateArg = dateFlagIndex >= 0 ? rawArgs[dateFlagIndex + 1] : rawArgs.find((item) => DATE_PATTERN.test(item));

  return {
    date: process.env.REPORT_DATE || (DATE_PATTERN.test(dateArg || "") ? dateArg : null),
    skipGcpExport: args.has("--skip-gcp-export") || process.env.YISHUN_DAILY_SKIP_GCP_EXPORT === "1",
    allowEmptyExport: !args.has("--no-allow-empty") && process.env.YISHUN_GCP_ANALYTICS_ALLOW_EMPTY !== "0",
  };
}

function hasAnalyticsInput(env) {
  return Boolean(env.YISHUN_ANALYTICS_FILE || env.YISHUN_ANALYTICS_FILES || env.YISHUN_ANALYTICS_DIR);
}

function runNode(args, { env = process.env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

function parseJsonObject(text) {
  const trimmed = text.trim();
  const start = trimmed.lastIndexOf("{");
  if (start === -1) return null;
  try {
    return JSON.parse(trimmed.slice(start));
  } catch {
    return null;
  }
}

async function runStep(label, args, options) {
  console.log(`\n[daily-ops-loop] ${label}`);
  const result = await runNode(args, options);
  if (result.code !== 0) {
    throw new Error(`${label} failed with code ${result.code ?? result.signal ?? "unknown"}`);
  }
  return result;
}

async function main() {
  const config = parseArgs();
  const env = { ...process.env };
  const dateArgs = config.date ? ["--date", config.date] : [];

  let exportOutputPath = null;
  if (!config.skipGcpExport && !hasAnalyticsInput(env)) {
    const exportArgs = [
      "scripts/yishun-export-gcp-analytics.mjs",
      ...dateArgs,
      ...(config.allowEmptyExport ? ["--allow-empty"] : []),
    ];
    const exportResult = await runStep("export GCP analytics", exportArgs, { env });
    const exportJson = parseJsonObject(exportResult.stdout);
    if (exportJson?.outputPath && existsSync(exportJson.outputPath)) {
      exportOutputPath = exportJson.outputPath;
      env.YISHUN_ANALYTICS_FILE = exportOutputPath;
    } else {
      console.warn("[daily-ops-loop] GCP export did not produce a readable outputPath; daily report will use existing analytics inputs only.");
    }
  }

  const reportResult = await runStep("build daily report", ["scripts/yishun-daily-data-report.mjs", ...dateArgs], { env });
  const reviewResult = await runStep("write daily ops review", ["scripts/yishun-daily-ops-review.mjs", ...dateArgs], { env });
  const reportJson = parseJsonObject(reportResult.stdout);
  const reviewJson = parseJsonObject(reviewResult.stdout);

  console.log(JSON.stringify({
    ok: true,
    date: config.date || reportJson?.date || reviewJson?.date || null,
    analyticsExportPath: exportOutputPath,
    reportDir: reportJson?.reportDir || reviewJson?.reportDir || null,
    analyticsSourceAvailable: reportJson?.analyticsSourceAvailable ?? null,
    routeStatusOk: reportJson?.routeStatusOk ?? null,
    paymentRisk: reportJson?.paymentRisk || null,
    reviewRisk: reviewJson?.risk || null,
    reviewOutputPath: reviewJson?.outputPath || null,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
