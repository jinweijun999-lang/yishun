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
    skipProductionFileExport: args.has("--skip-production-file-export") || process.env.YISHUN_DAILY_SKIP_PRODUCTION_FILE_EXPORT === "1",
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

  for (let index = 0; index < trimmed.length; index += 1) {
    if (trimmed[index] !== "{") continue;
    try {
      const parsed = JSON.parse(trimmed.slice(index));
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : null;
    } catch {
      // Keep scanning; child commands may print status lines before their final JSON object.
    }
  }

  return null;
}

function sanitizeDiagnostic(text) {
  return String(text || "")
    .replace(/sk_(test|live)_[A-Za-z0-9_=-]+/g, "sk_$1_[redacted]")
    .replace(/pk_(test|live)_[A-Za-z0-9_=-]+/g, "pk_$1_[redacted]")
    .replace(/whsec_[A-Za-z0-9_=-]+/g, "whsec_[redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "postgresql://[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function childFailureSummary(label, result) {
  const status = result.code ?? result.signal ?? "unknown";
  const parsed = parseJsonObject(result.stderr) || parseJsonObject(result.stdout);
  const attemptSummary = Array.isArray(parsed?.attempts) && parsed.attempts.length
    ? parsed.attempts.map((attempt) => {
      const mode = attempt.mode || "unknown";
      const attemptStatus = attempt.code ?? attempt.signal ?? "unknown";
      const detail = sanitizeDiagnostic(attempt.stderr || attempt.message);
      return detail ? `${mode}=${attemptStatus} ${detail}` : `${mode}=${attemptStatus}`;
    }).join("; ")
    : "";
  const structuredDiagnostic = [
    sanitizeDiagnostic(parsed?.message),
    attemptSummary,
  ].filter(Boolean).join("; ");
  const diagnostic = structuredDiagnostic ||
    sanitizeDiagnostic(result.stderr) ||
    sanitizeDiagnostic(result.stdout);
  return diagnostic
    ? `${label} failed with code ${status}: ${diagnostic}`
    : `${label} failed with code ${status}`;
}

async function runStep(label, args, options) {
  console.log(`\n[daily-ops-loop] ${label}`);
  const result = await runNode(args, options);
  if (result.code !== 0) {
    throw new Error(childFailureSummary(label, result));
  }
  return result;
}

async function main() {
  const config = parseArgs();
  const env = { ...process.env };
  const dateArgs = config.date ? ["--date", config.date] : [];

  let exportOutputPath = null;
  let productionFileExportError = null;
  if (!config.skipProductionFileExport && !hasAnalyticsInput(env)) {
    console.log("\n[daily-ops-loop] export production analytics file");
    const productionFileArgs = [
      "scripts/yishun-export-production-analytics-file.mjs",
      ...dateArgs,
      ...(config.allowEmptyExport ? ["--allow-empty"] : []),
    ];
    const productionFileResult = await runNode(productionFileArgs, { env });
    if (productionFileResult.code === 0) {
      const productionFileJson = parseJsonObject(productionFileResult.stdout);
      if (productionFileJson?.outputPath && existsSync(productionFileJson.outputPath)) {
        exportOutputPath = productionFileJson.outputPath;
        env.YISHUN_ANALYTICS_FILE = exportOutputPath;
      } else {
        const diagnostic = sanitizeDiagnostic(productionFileResult.stderr) || sanitizeDiagnostic(productionFileResult.stdout);
        productionFileExportError = diagnostic
          ? `production file export did not produce a readable outputPath: ${diagnostic}`
          : "production file export did not produce a readable outputPath";
      }
    } else {
      productionFileExportError = childFailureSummary("production file export", productionFileResult);
      const fallbackNote = config.skipGcpExport
        ? "Cloud Logging fallback was skipped"
        : "Cloud Logging fallback was used";
      env.YISHUN_ANALYTICS_SOURCE_NOTE = `${productionFileExportError}; ${fallbackNote}`;
      console.warn(`[daily-ops-loop] ${productionFileExportError}; ${config.skipGcpExport ? "GCP export skipped." : "falling back to Cloud Logging export."}`);
    }
  }

  if (!config.skipGcpExport && !hasAnalyticsInput(env)) {
    const exportArgs = [
      "scripts/yishun-export-gcp-analytics.mjs",
      ...dateArgs,
      ...(config.allowEmptyExport ? ["--allow-empty"] : []),
    ];
    console.log("\n[daily-ops-loop] export GCP analytics");
    const exportResult = await runNode(exportArgs, { env });
    if (exportResult.code === 0) {
      const exportJson = parseJsonObject(exportResult.stdout);
      if (exportJson?.outputPath && existsSync(exportJson.outputPath)) {
        exportOutputPath = exportJson.outputPath;
        env.YISHUN_ANALYTICS_FILE = exportOutputPath;
      } else {
        console.warn("[daily-ops-loop] GCP export did not produce a readable outputPath; daily report will use existing analytics inputs only.");
      }
    } else {
      const gcpExportError = childFailureSummary("GCP analytics export", exportResult);
      env.YISHUN_ANALYTICS_SOURCE_NOTE = [
        env.YISHUN_ANALYTICS_SOURCE_NOTE,
        gcpExportError,
      ].filter(Boolean).join("; ");
      console.warn(`[daily-ops-loop] ${gcpExportError}; continuing daily report without a fresh analytics export.`);
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
    productionFileExportError,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
