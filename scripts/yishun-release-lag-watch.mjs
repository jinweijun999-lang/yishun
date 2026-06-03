#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_REPO = "jinweijun999-lang/yishun";
const DEFAULT_BASE_URL = "https://11263.com";
const DEFAULT_OUTBOX = "/Users/xiajarvan/.openclaw/workspace/codex-bridge/outbox";
const DEFAULT_FALLBACK = "/Users/xiajarvan/Documents/流量矩阵/ops/reports";
const DEFAULT_EVIDENCE_DIR = "reports/evidence";
const TIME_ZONE = "Asia/Shanghai";
const WAITING_RUN_STATUSES = ["queued", "pending", "waiting", "requested"];

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

function isoStamp(value = new Date()) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const valueFor = (name, fallback) => {
    const prefixed = rawArgs.find((item) => item.startsWith(`${name}=`));
    if (prefixed) return prefixed.slice(name.length + 1);
    const index = rawArgs.indexOf(name);
    return index >= 0 ? rawArgs[index + 1] || fallback : fallback;
  };

  return {
    repo: valueFor("--repo", process.env.YISHUN_GITHUB_REPO || DEFAULT_REPO),
    baseUrl: valueFor("--base-url", process.env.YISHUN_PRODUCTION_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    outboxDir: valueFor("--outbox-dir", process.env.CODEX_BRIDGE_OUTBOX || DEFAULT_OUTBOX),
    fallbackDir: valueFor("--fallback-dir", process.env.YISHUN_OPS_REPORT_FALLBACK_DIR || DEFAULT_FALLBACK),
    evidenceDir: valueFor("--evidence-dir", process.env.YISHUN_RELEASE_LAG_EVIDENCE_DIR || DEFAULT_EVIDENCE_DIR),
    watchedWorkflows: valueFor("--watched-workflows", process.env.YISHUN_WATCHED_WORKFLOWS || "Next.js CI/CD,YiShun Daily Ops Export")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    maxQueuedMinutes: Number(valueFor("--max-queued-minutes", process.env.YISHUN_MAX_QUEUED_MINUTES || "10")),
    githubTimeoutMs: Number(valueFor("--github-timeout-ms", process.env.YISHUN_RELEASE_LAG_GITHUB_TIMEOUT_MS || "12000")),
    healthTimeoutMs: Number(valueFor("--health-timeout-ms", process.env.YISHUN_RELEASE_LAG_HEALTH_TIMEOUT_MS || "10000")),
    failOnBlocker: args.has("--fail-on-blocker"),
    help: args.has("--help") || args.has("-h"),
  };
}

function usage() {
  console.log(`Usage:
  npm run ops:release-lag
  npm run ops:release-lag -- --fail-on-blocker
  npm run ops:release-lag -- --max-queued-minutes=10

Checks GitHub Actions waiting runs plus production /api/health release version.
Writes JSON evidence and a bridge outbox report without requiring GCP SSH or the self-hosted runner.`);
}

function redact(text) {
  return String(text || "")
    .replace(/gh[pousr]_[A-Za-z0-9_]+/g, "[redacted-github-token]")
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "[redacted-google-token]")
    .replace(/sk_(test|live)_[A-Za-z0-9_]+/g, "sk_$1_[redacted]")
    .replace(/whsec_[A-Za-z0-9_]+/g, "whsec_[redacted]");
}

async function runCommand(command, args, { timeoutMs = 12000 } = {}) {
  const started = Date.now();
  return await new Promise((resolve) => {
    const child = spawn(command, args, {
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: "1" },
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed) child.kill("SIGKILL");
      }, 2000).unref();
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr?.on("data", (chunk) => stderrChunks.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        code: null,
        durationMs: Date.now() - started,
        stdout: "",
        stderr: redact(error instanceof Error ? error.message : String(error)),
        timedOut,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0 && !timedOut,
        code,
        durationMs: Date.now() - started,
        stdout: redact(Buffer.concat(stdoutChunks).toString("utf8")),
        stderr: redact(Buffer.concat(stderrChunks).toString("utf8")),
        timedOut,
      });
    });
  });
}

function parseJsonResult(result, fallback) {
  if (!result.ok || !result.stdout) return fallback;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return fallback;
  }
}

async function fetchJson(url, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "user-agent": "yishun-release-lag-watch/1.0" },
    });
    const body = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, latencyMs: Date.now() - started, body };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function queueAgeMinutes(run, now = new Date()) {
  const createdAt = new Date(run.created_at || run.createdAt || now);
  return Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 60000));
}

function normalizeRun(run, config) {
  return {
    databaseId: run.id || run.databaseId,
    runNumber: run.run_number || run.runNumber,
    workflowName: run.name || run.workflowName,
    displayTitle: run.display_title || run.displayTitle || "",
    headBranch: run.head_branch || run.headBranch,
    headSha: run.head_sha || run.headSha,
    status: run.status,
    conclusion: run.conclusion || "",
    createdAt: run.created_at || run.createdAt,
    updatedAt: run.updated_at || run.updatedAt,
    queuedMinutes: queueAgeMinutes(run),
    stale: queueAgeMinutes(run) > config.maxQueuedMinutes,
    url: run.html_url || run.url,
  };
}

function mergeRuns(...groups) {
  const byId = new Map();
  for (const group of groups) {
    for (const run of group) {
      if (!run?.databaseId) continue;
      byId.set(run.databaseId, { ...byId.get(run.databaseId), ...run });
    }
  }
  return [...byId.values()].sort((a, b) => b.queuedMinutes - a.queuedMinutes);
}

function summarizeRunner(runnerPayload) {
  const runners = Array.isArray(runnerPayload?.runners) ? runnerPayload.runners : [];
  const runner = runners.find((item) => item.name === "yishun-prod-runner") || null;
  return {
    found: Boolean(runner),
    name: runner?.name || "yishun-prod-runner",
    status: runner?.status || "unknown",
    busy: runner?.busy ?? null,
    labels: (runner?.labels || []).map((label) => label.name).filter(Boolean),
  };
}

function buildSummary({ config, runner, queuedRuns, health, ghErrors }) {
  const staleWatchedRuns = queuedRuns.filter((run) => run.stale);
  const latestQueuedMainRelease = queuedRuns.find((run) => run.headBranch === "main" && run.workflowName === "Next.js CI/CD") || null;
  const productionVersion = health.ok ? health.body?.version || null : null;
  const releaseLag = {
    pending: Boolean(latestQueuedMainRelease?.headSha && productionVersion && latestQueuedMainRelease.headSha !== productionVersion),
    productionVersion,
    queuedMainSha: latestQueuedMainRelease?.headSha || null,
    queuedMainRunUrl: latestQueuedMainRelease?.url || null,
    queuedMainQueuedMinutes: latestQueuedMainRelease?.queuedMinutes ?? null,
  };

  const blockers = [];
  const watch = [];
  if (runner.status === "offline") blockers.push("GitHub reports yishun-prod-runner offline");
  if (staleWatchedRuns.length) blockers.push(`${staleWatchedRuns.length} watched workflow run(s) are stale-waiting`);
  if (releaseLag.pending) blockers.push(`production release ${productionVersion} is behind queued main release ${latestQueuedMainRelease.headSha}`);
  if (!health.ok) blockers.push("production /api/health is unavailable or non-2xx");
  if (!runner.found) watch.push("runner inventory was unavailable or did not include yishun-prod-runner");
  if (queuedRuns.length && !staleWatchedRuns.length) watch.push(`${queuedRuns.length} watched workflow run(s) are waiting inside threshold`);
  if (ghErrors.length) watch.push(`${ghErrors.length} GitHub query issue(s) were recorded`);
  if (health.ok && productionVersion) watch.push(`production healthy on release ${productionVersion}`);

  return {
    blocked: blockers.length > 0,
    level: blockers.length ? "action_required" : watch.length ? "watch" : "clear",
    blockers,
    watch,
    staleWatchedRuns,
    latestQueuedMainRelease,
    releaseLag,
    checkedWorkflows: config.watchedWorkflows,
  };
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
      "Bridge outbox write failed; this fallback report preserves the YiShun release lag watch result.",
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

function listItems(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None.";
}

function runRows(runs) {
  return runs.length
    ? runs.map((run) => `- ${run.workflowName} #${run.runNumber || run.databaseId} ${run.status} ${run.queuedMinutes}m ${run.headBranch}@${run.headSha}: ${run.url}`).join("\n")
    : "- None.";
}

function reportMarkdown({ stamp, config, summary, runner, health, evidencePath, delivery }) {
  return `# YiShun Release Lag Watch - ${stamp}

## Conclusion

Release lag risk: **${summary.level}**.

${listItems(summary.blockers.length ? summary.blockers : summary.watch)}

## Evidence

- Production health: ${health.ok ? "ok" : "failed"} (${health.status || health.error || "unknown"})
- Production release: ${summary.releaseLag.productionVersion || "unknown"}
- Queued main release: ${summary.releaseLag.queuedMainSha || "none"}
- Release lag pending: ${summary.releaseLag.pending ? "yes" : "no"}
- Latest queued main run: ${summary.releaseLag.queuedMainRunUrl || "none"}
- Runner: ${runner.name} status=${runner.status} busy=${runner.busy ?? "unknown"} labels=${runner.labels.length ? runner.labels.join(",") : "unknown"}
- Watched workflows: ${summary.checkedWorkflows.join(", ")}
- Stale watched runs: ${summary.staleWatchedRuns.length}
- JSON evidence: \`${evidencePath}\`
- Outbox delivery: ${delivery.delivery}${delivery.fallbackUsed ? ` (${delivery.error})` : ""}

## Stale / Waiting Runs

${runRows(summary.staleWatchedRuns)}

## Watch Notes

${listItems(summary.watch)}

## Changed Files

- \`scripts/yishun-release-lag-watch.mjs\`
- \`.github/workflows/yishun_runner_watchdog.yml\`
- \`package.json\`

## Verification

- Queried GitHub Actions waiting runs with \`gh\`.
- Checked production \`/api/health\`.
- No PM2 restart, production deploy, real Stripe charge/refund, destructive database operation, force push, or user-data deletion was performed.

## Next Action

${summary.blocked
    ? "Recover the self-hosted runner or deploy access path, then let the queued main deploy finish and rerun strict production smoke."
    : "Keep the watcher scheduled and rerun strict production smoke after the next main deploy."}
`;
}

async function main() {
  const config = parseArgs();
  if (config.help) {
    usage();
    return;
  }
  if (!Number.isFinite(config.maxQueuedMinutes) || config.maxQueuedMinutes < 0) {
    throw new Error("--max-queued-minutes must be a non-negative number");
  }

  const runnerInventory = await runCommand("gh", ["api", `repos/${config.repo}/actions/runners`], { timeoutMs: config.githubTimeoutMs });
  const waitingRunApiResults = await Promise.all(WAITING_RUN_STATUSES.map((status) => runCommand("gh", [
    "api",
    `repos/${config.repo}/actions/runs?status=${status}&per_page=100`,
  ], { timeoutMs: config.githubTimeoutMs })));
  const runsListResult = await runCommand("gh", [
    "run",
    "list",
    "--repo",
    config.repo,
    "--limit",
    "30",
    "--json",
    "databaseId,displayTitle,name,status,conclusion,workflowName,headBranch,headSha,createdAt,updatedAt,url",
  ], { timeoutMs: config.githubTimeoutMs });
  const health = await fetchJson(`${config.baseUrl}/api/health`, config.healthTimeoutMs);

  const runner = summarizeRunner(parseJsonResult(runnerInventory, {}));
  const ghErrors = [runnerInventory, ...waitingRunApiResults, runsListResult]
    .filter((result) => !result.ok)
    .map((result) => result.stderr || result.stdout || `exit ${result.code}`);
  const apiRuns = waitingRunApiResults.flatMap((result) =>
    (parseJsonResult(result, {})?.workflow_runs || [])
      .filter((run) => config.watchedWorkflows.includes(run.name))
      .map((run) => normalizeRun(run, config))
  );
  const listedRuns = parseJsonResult(runsListResult, [])
    .filter((run) => WAITING_RUN_STATUSES.includes(run.status))
    .filter((run) => config.watchedWorkflows.includes(run.workflowName || run.name))
    .map((run) => normalizeRun(run, config));
  const queuedRuns = mergeRuns(apiRuns, listedRuns);
  const summary = buildSummary({ config, runner, queuedRuns, health, ghErrors });

  const stamp = cstStamp();
  const evidencePath = path.join(config.evidenceDir, `yishun-release-lag-watch-${isoStamp()}.json`);
  const evidence = {
    ok: !summary.blocked,
    checkedAt: new Date().toISOString(),
    config: {
      repo: config.repo,
      baseUrl: config.baseUrl,
      watchedWorkflows: config.watchedWorkflows,
      maxQueuedMinutes: config.maxQueuedMinutes,
    },
    runner,
    health,
    queuedRuns,
    summary,
    ghErrors,
    evidencePath,
  };
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

  const fileName = `${stamp}-yishun-release-lag-watch.result.md`;
  const placeholderDelivery = { delivery: "pending", fallbackUsed: false, error: null };
  const content = reportMarkdown({ stamp, config, summary, runner, health, evidencePath, delivery: placeholderDelivery });
  const delivery = await writeResult(config.outboxDir, config.fallbackDir, fileName, content);
  if (delivery.delivery !== "bridge_outbox") {
    const updated = reportMarkdown({ stamp, config, summary, runner, health, evidencePath, delivery });
    await writeFile(delivery.outputPath, updated, "utf8");
  }

  const consolePayload = {
    ok: !summary.blocked,
    level: summary.level,
    blockers: summary.blockers,
    watch: summary.watch,
    releaseLag: summary.releaseLag,
    runner,
    evidencePath,
    resultPath: delivery.outputPath,
  };
  console.log(JSON.stringify(consolePayload, null, 2));
  if (config.failOnBlocker && summary.blocked) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
