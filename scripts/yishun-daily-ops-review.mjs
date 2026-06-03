#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const TIME_ZONE = "Asia/Shanghai";
const DEFAULT_OUTBOX = "/Users/xiajarvan/.openclaw/workspace/codex-bridge/outbox";
const DEFAULT_FALLBACK = "/Users/xiajarvan/Documents/流量矩阵/ops/reports";

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

function cstStamp(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}${map.month}${map.day}-${map.hour}${map.minute}`;
}

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const dateFlagIndex = rawArgs.indexOf("--date");
  const dateArg = dateFlagIndex >= 0 ? rawArgs[dateFlagIndex + 1] : rawArgs.find((item) => /^\d{4}-\d{2}-\d{2}$/.test(item));
  return {
    help: args.has("--help") || args.has("-h"),
    date: process.env.REPORT_DATE || (/^\d{4}-\d{2}-\d{2}$/.test(dateArg || "") ? dateArg : cstDate()),
    reportRoot: process.env.YISHUN_DAILY_REPORT_DIR || path.join("reports", "daily"),
    outboxDir: process.env.CODEX_BRIDGE_OUTBOX || DEFAULT_OUTBOX,
    fallbackDir: process.env.YISHUN_OPS_REPORT_FALLBACK_DIR || DEFAULT_FALLBACK,
  };
}

function printUsage() {
  console.log(`Usage:
  npm run ops:daily-review
  npm run ops:daily-review -- --date YYYY-MM-DD

Reads a generated YiShun daily report package and writes a concise bridge outbox review.

Environment:
  REPORT_DATE                       Override the report date.
  YISHUN_DAILY_REPORT_DIR           Report package root. Defaults to reports/daily.
  CODEX_BRIDGE_OUTBOX               Bridge outbox destination.
  YISHUN_OPS_REPORT_FALLBACK_DIR    Fallback report directory if bridge writing fails.`);
}

async function readText(filePath, fallback = "") {
  if (!existsSync(filePath)) return fallback;
  return readFile(filePath, "utf8");
}

async function readJson(filePath, fallback = null) {
  const text = await readText(filePath, "");
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function bullets(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function firstItems(items, limit) {
  const trimmed = items.slice(0, limit);
  return trimmed.length ? trimmed.map((item) => `- ${item}`).join("\n") : "- None from available inputs.";
}

function value(value, fallback = "unknown") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function compactText(value, max = 260) {
  const compacted = String(value || "").replace(/\s+/g, " ").trim();
  return compacted.length > max ? `${compacted.slice(0, max - 1)}...` : compacted;
}

function routeStatusSummary(routeStatus) {
  if (!routeStatus || routeStatus.ok === undefined) return "unknown";
  if (routeStatus.ok === null || routeStatus.skipped) return "skipped";
  const failed = (routeStatus.routes || []).filter((route) => route.ok === false);
  return routeStatus.ok ? `ok (${(routeStatus.routes || []).length} routes)` : `failed (${failed.length} routes)`;
}

function failedRouteLabels(routeStatus) {
  return (routeStatus?.routes || [])
    .filter((route) => route.ok === false)
    .map((route) => `${route.route}=${route.status || route.error || "failed"}`);
}

function exportSourceSummary(analyticsSource) {
  const meta = Array.isArray(analyticsSource?.exportMeta) ? analyticsSource.exportMeta : [];
  if (!meta.length) return "none";
  return meta.map((item) => {
    const source = value(item.sourceKind, "unknown");
    const events = value(item.eventCount, "0");
    const rows = value(item.parsedRows ?? item.entryCount ?? item.rawLineCount, "0");
    const generatedAt = value(item.generatedAt, "unknown");
    return `${source}: events=${events} rows=${rows} generated=${generatedAt}`;
  }).join("; ");
}

function analyticsSourceStatus(analyticsSource) {
  if (!analyticsSource?.available) return "unavailable";
  const freshness = analyticsSource.fresh === false ? "stale" : "fresh";
  const usability = analyticsSource.usableForFunnel === false ? "no report-date funnel events" : "report-date events present";
  return `available/${freshness} (${value(analyticsSource.reportDateEvents, "0")} report-date events, ${value(analyticsSource.parsedRows, "0")} parsed rows, ${usability})`;
}

function growthScorecardSummary(scorecard) {
  const metrics = Array.isArray(scorecard?.metrics) ? scorecard.metrics : [];
  if (!metrics.length) return "unavailable";
  const actionRequired = metrics.filter((metric) => metric.status === "action_required").length;
  const watch = metrics.filter((metric) => metric.status === "watch").length;
  const noData = metrics.filter((metric) => metric.status === "no_data").length;
  return `${actionRequired} action_required / ${watch} watch / ${noData} no_data`;
}

function growthScorecardWatchItems(scorecard) {
  const metrics = Array.isArray(scorecard?.metrics) ? scorecard.metrics : [];
  return metrics
    .filter((metric) => ["action_required", "watch"].includes(metric.status))
    .map((metric) => `${metric.metric}=${metric.ratePercent ?? "n/a"}% target=${metric.targetPercent}% status=${metric.status}`);
}

function assessRisk({ uptime, routeStatus, analyticsSource, payment, growthScorecard, anomalies }) {
  const actionRequired = [];
  const watch = [];
  const rawReportDateEvents = Number(analyticsSource?.rawReportDateEvents || 0);
  const productEvents = Number(analyticsSource?.reportDateEvents || 0);
  const operationalProbeEvents = Number(analyticsSource?.operationalProbeEvents || 0);
  const exportMeta = Array.isArray(analyticsSource?.exportMeta) ? analyticsSource.exportMeta : [];

  if (uptime?.ok === false) actionRequired.push(`production health failed (${value(uptime.status || uptime.error)})`);
  const failedRoutes = failedRouteLabels(routeStatus);
  if (failedRoutes.length) actionRequired.push(`core route patrol failed (${failedRoutes.join(", ")})`);
  if (payment?.risk === "action_required") actionRequired.push("payment reconciliation is action_required");
  if (Number(payment?.webhookFailures || 0) > 0) actionRequired.push(`${payment.webhookFailures} Stripe webhook failures found`);
  if (payment?.checks?.webhookHasCheckoutWithoutFulfillment) actionRequired.push("checkout starts have no fulfilled webhook rows");
  const growthItems = growthScorecardWatchItems(growthScorecard);
  const criticalGrowthItems = growthItems.filter((item) => item.includes("status=action_required"));
  if (criticalGrowthItems.length) actionRequired.push(`growth scorecard has action_required metrics: ${criticalGrowthItems.join("; ")}`);

  if (uptime?.ok === null || uptime?.skipped) watch.push("health check was skipped");
  if (routeStatus?.ok === null || routeStatus?.skipped) watch.push("core route patrol was skipped");
  if (payment?.risk === "watch") watch.push("payment reconciliation is watch");
  const watchGrowthItems = growthItems.filter((item) => item.includes("status=watch"));
  if (watchGrowthItems.length) watch.push(`growth scorecard has watch metrics: ${watchGrowthItems.join("; ")}`);
  if (analyticsSource?.healthAnalyticsStatus === "configured" && analyticsSource?.available === false) {
    watch.push("production analytics is configured, but no export source was available to the report");
  }
  if (analyticsSource?.available && analyticsSource?.fresh === false) {
    const issues = Array.isArray(analyticsSource?.freshness?.issues) ? analyticsSource.freshness.issues : [];
    watch.push(`analytics export source is stale${issues.length ? `: ${issues.join("; ")}` : ""}`);
  }
  if (/production file export failed/i.test(analyticsSource?.note || "")) {
    watch.push(`production analytics file export failed: ${compactText(analyticsSource.note)}`);
  }
  if (Number(analyticsSource?.malformedRows || 0) > 0) watch.push(`${analyticsSource.malformedRows} malformed analytics rows were ignored`);
  if (rawReportDateEvents > 0 && productEvents === 0 && operationalProbeEvents > 0) {
    watch.push("analytics export contains only operational probe events; product funnel still has zero user events");
  }
  if (exportMeta.some((meta) => meta.sourceKind === "cloud_logging" && Number(meta.entryCount || 0) === 0)) {
    watch.push("Cloud Logging analytics export returned zero entries");
  }
  if (exportMeta.some((meta) => meta.sourceKind === "production_file" && Number(meta.rawLineCount || 0) === 0)) {
    watch.push("production analytics file sink export returned zero rows");
  }
  if (anomalies.some((item) => /Checkout starts|Stripe webhook DB summary unavailable|No analytics events/i.test(item))) {
    watch.push("daily report contains funnel or telemetry anomalies");
  }

  if (actionRequired.length) return { level: "action_required", items: actionRequired };
  if (watch.length) return { level: "watch", items: watch };
  return { level: "clear", items: ["No P0/P1 daily operations risk from available inputs."] };
}

async function writeResult(preferredDir, fallbackDir, fileName, content) {
  try {
    await mkdir(preferredDir, { recursive: true });
    const outputPath = path.join(preferredDir, fileName);
    await writeFile(outputPath, content);
    return { outputPath, delivery: "bridge_outbox", fallbackUsed: false, error: null };
  } catch (error) {
    await mkdir(fallbackDir, { recursive: true });
    const outputPath = path.join(fallbackDir, fileName);
    await writeFile(outputPath, [
      "Bridge outbox write failed; this fallback report preserves the YiShun daily operations review for OpenClaw/Jarvan.",
      "",
      `Outbox error: ${error instanceof Error ? error.message : "unknown error"}`,
      "",
      content,
    ].join("\n"));
    return {
      outputPath,
      delivery: "fallback_report",
      fallbackUsed: true,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}

async function main() {
  const config = parseArgs();
  if (config.help) {
    printUsage();
    return;
  }

  const reportDir = path.join(config.reportRoot, `yishun-daily-${config.date}`);
  const summaryPath = path.join(reportDir, "summary.md");

  if (!existsSync(summaryPath)) {
    throw new Error(`Daily report summary not found: ${summaryPath}. Run npm run report:yishun-daily first.`);
  }

  const [summary, anomalyText, questionText, uptime, routeStatus, analyticsSource, payment, growthScorecard] = await Promise.all([
    readText(summaryPath),
    readText(path.join(reportDir, "anomaly_notes.md")),
    readText(path.join(reportDir, "analyst_questions.md")),
    readJson(path.join(reportDir, "uptime.json"), {}),
    readJson(path.join(reportDir, "route_status.json"), {}),
    readJson(path.join(reportDir, "analytics_source.json"), {}),
    readJson(path.join(reportDir, "payment_reconciliation.json"), {}),
    readJson(path.join(reportDir, "growth_scorecard.json"), {}),
  ]);

  const anomalies = bullets(anomalyText);
  const questions = bullets(questionText);
  const risk = assessRisk({ uptime, routeStatus, analyticsSource, payment, growthScorecard, anomalies });
  const stamp = cstStamp();
  const fileName = `${stamp}-yishun-daily-ops-review.result.md`;
  const content = `# YiShun Daily Operations Review - ${config.date}

## Conclusion

Daily operations risk: **${risk.level}**.

${firstItems(risk.items, 6)}

## Key Metrics

- Health: ${uptime?.ok === null ? "skipped" : uptime?.ok ? "ok" : "failed"}
- Health URL: ${value(uptime?.url)}
- Core routes: ${routeStatusSummary(routeStatus)}
- Core route base URL: ${value(routeStatus?.baseUrl)}
- Analytics source: ${analyticsSourceStatus(analyticsSource)}
- Analytics health status: ${value(analyticsSource?.healthAnalyticsStatus)}
- Analytics raw/product/ops-probe events: ${value(analyticsSource?.rawReportDateEvents, "0")} / ${value(analyticsSource?.reportDateEvents, "0")} / ${value(analyticsSource?.operationalProbeEvents, "0")}
- Analytics source note: ${analyticsSource?.note ? compactText(analyticsSource.note) : "none"}
- Analytics export sources: ${exportSourceSummary(analyticsSource)}
- Growth scorecard: ${growthScorecardSummary(growthScorecard)}
- Payment reconciliation: ${value(payment?.risk)}
- Checkout starts: ${value(payment?.checkoutStarted, "0")}
- Entitlements granted: ${value(payment?.entitlementGranted, "0")}
- Webhook fulfilled: ${value(payment?.webhookFulfilled, "0")}
- Webhook failures: ${value(payment?.webhookFailures, "0")}

## Anomalies

${firstItems(anomalies, 8)}

## Analyst Questions

${firstItems(questions, 6)}

## Verification

- Read daily report package: \`${reportDir}\`
- Parsed \`uptime.json\`, \`route_status.json\`, \`analytics_source.json\`, and \`payment_reconciliation.json\`
- Parsed \`growth_scorecard.json\` for launch-readiness conversion thresholds
- No Stripe live API calls, real charges/refunds, destructive database operations, force push, or production restarts were performed.

## Next Action

${risk.level === "action_required"
    ? "Investigate the action_required payment/health item before treating YiShun as launch-ready."
    : risk.level === "watch"
      ? "Keep the data loop running and connect a fresh analytics export source so zero-event days are not misread."
      : "Continue Stripe test-mode patrols and production analytics export verification."}

## Daily Summary Source

${summary.trim()}
`;

  const result = await writeResult(config.outboxDir, config.fallbackDir, fileName, content);
  console.log(JSON.stringify({
    ok: true,
    date: config.date,
    reportDir,
    risk: risk.level,
    outputPath: result.outputPath,
    delivery: result.delivery,
    fallbackUsed: result.fallbackUsed,
    error: result.error,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
