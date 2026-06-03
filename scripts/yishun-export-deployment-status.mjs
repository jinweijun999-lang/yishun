#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_REPO = "jinweijun999-lang/yishun";
const DEFAULT_BASE_URL = "https://11263.com";
const DEFAULT_OUT_DIR = "output/yishun-deployment-status";
const TARGET_WORKFLOW = "Next.js CI/CD";
const DEPLOY_JOB_NAME = "Deploy to Production";
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MAX_QUEUED_MINUTES = 10;

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const valueFor = (name, fallback) => {
    const prefixed = rawArgs.find((item) => item.startsWith(`${name}=`));
    if (prefixed) return prefixed.slice(name.length + 1);
    const index = rawArgs.indexOf(name);
    return index >= 0 ? rawArgs[index + 1] || fallback : fallback;
  };

  return {
    repo: valueFor("--repo", process.env.YISHUN_GITHUB_REPO || DEFAULT_REPO),
    baseUrl: valueFor("--base-url", process.env.YISHUN_PRODUCTION_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    outDir: valueFor("--out-dir", process.env.YISHUN_DEPLOYMENT_STATUS_DIR || DEFAULT_OUT_DIR),
    branch: valueFor("--branch", process.env.YISHUN_DEPLOYMENT_STATUS_BRANCH || "main"),
    timeoutMs: Number(valueFor("--timeout-ms", process.env.YISHUN_DEPLOYMENT_STATUS_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS))),
    maxQueuedMinutes: Number(valueFor("--max-queued-minutes", process.env.YISHUN_MAX_QUEUED_MINUTES || String(DEFAULT_MAX_QUEUED_MINUTES))),
    allowGhFailure: !new Set(rawArgs).has("--fail-on-gh-error"),
  };
}

function isoStamp(value = new Date()) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function dayStamp(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function redacted(text) {
  return String(text || "")
    .replace(/gh[pousr]_[A-Za-z0-9_]+/g, "[redacted-github-token]")
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "[redacted-google-token]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

function queueAgeMinutes(value, now = new Date()) {
  const parsed = new Date(value || now);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.round((now.getTime() - parsed.getTime()) / 60000));
}

function runCommand(command, args, { timeoutMs }) {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        GH_TOKEN: process.env.GH_TOKEN || process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2000).unref();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        code: null,
        signal: null,
        timedOut,
        durationMs: Date.now() - started,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: error instanceof Error ? error.message : String(error),
      });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0 && !timedOut,
        code,
        signal,
        timedOut,
        durationMs: Date.now() - started,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

async function fetchJson(url, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "user-agent": "yishun-deployment-status/1.0" },
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

function parseJsonResult(result, fallback) {
  if (!result.ok || !result.stdout) return fallback;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return fallback;
  }
}

function normalizeRun(run) {
  return {
    databaseId: run.databaseId,
    workflowName: run.workflowName || run.name || "",
    displayTitle: run.displayTitle || "",
    status: run.status || "",
    conclusion: run.conclusion || "",
    headBranch: run.headBranch || "",
    headSha: run.headSha || "",
    createdAt: run.createdAt || "",
    updatedAt: run.updatedAt || "",
    url: run.url || "",
  };
}

function summarizeJobs(runView) {
  return (runView?.jobs || []).map((job) => ({
    name: job.name || "",
    status: job.status || "",
    conclusion: job.conclusion || "",
    startedAt: job.startedAt || "",
    completedAt: job.completedAt || "",
    url: job.url || "",
    queuedMinutes: job.status === "queued" ? queueAgeMinutes(job.startedAt || runView?.createdAt) : null,
  }));
}

function buildSummary({ latestMainRun, jobs, health, config, ghAvailable }) {
  const deployJob = jobs.find((job) => job.name === DEPLOY_JOB_NAME) || null;
  const productionVersion = health.ok ? health.body?.version || null : null;
  const expectedMainSha = latestMainRun?.headSha || null;
  const runQueuedMinutes = latestMainRun && ["queued", "pending", "waiting", "requested"].includes(latestMainRun.status)
    ? queueAgeMinutes(latestMainRun.createdAt)
    : null;
  const deployQueuedMinutes = deployJob?.status === "queued"
    ? queueAgeMinutes(deployJob.startedAt || latestMainRun?.createdAt)
    : null;
  const maxQueue = Number.isFinite(config.maxQueuedMinutes) ? config.maxQueuedMinutes : DEFAULT_MAX_QUEUED_MINUTES;
  const releaseLag = Boolean(expectedMainSha && productionVersion && expectedMainSha !== productionVersion);
  const staleQueue = Boolean(
    (runQueuedMinutes !== null && runQueuedMinutes > maxQueue) ||
    (deployQueuedMinutes !== null && deployQueuedMinutes > maxQueue),
  );
  const risk = !health.ok
    ? "action_required"
    : !ghAvailable
      ? "watch"
    : releaseLag && staleQueue
      ? "action_required"
      : releaseLag || staleQueue
        ? "watch"
        : "clear";

  return {
    risk,
    productionVersion,
    expectedMainSha,
    releaseLag,
    staleQueue,
    maxQueuedMinutes: maxQueue,
    runQueuedMinutes,
    deployQueuedMinutes,
    deployJobStatus: deployJob?.status || null,
    deployJobConclusion: deployJob?.conclusion || null,
    deployJobUrl: deployJob?.url || null,
  };
}

async function main() {
  const config = parseArgs();
  if (!Number.isFinite(config.timeoutMs) || config.timeoutMs <= 0) throw new Error("--timeout-ms must be positive");
  if (!Number.isFinite(config.maxQueuedMinutes) || config.maxQueuedMinutes < 0) throw new Error("--max-queued-minutes must be non-negative");

  const health = await fetchJson(`${config.baseUrl}/api/health`, config.timeoutMs);
  const runListResult = await runCommand("gh", [
    "run",
    "list",
    "--repo",
    config.repo,
    "--branch",
    config.branch,
    "--workflow",
    TARGET_WORKFLOW,
    "--limit",
    "10",
    "--json",
    "databaseId,displayTitle,status,conclusion,workflowName,headBranch,headSha,createdAt,updatedAt,url",
  ], { timeoutMs: config.timeoutMs });

  const runs = parseJsonResult(runListResult, []).map(normalizeRun);
  const latestMainRun = runs.find((run) => run.workflowName === TARGET_WORKFLOW) || runs[0] || null;
  let runViewResult = null;
  let jobs = [];
  if (latestMainRun?.databaseId) {
    runViewResult = await runCommand("gh", [
      "run",
      "view",
      String(latestMainRun.databaseId),
      "--repo",
      config.repo,
      "--json",
      "status,conclusion,jobs,url,headSha,createdAt,updatedAt",
    ], { timeoutMs: config.timeoutMs });
    jobs = summarizeJobs(parseJsonResult(runViewResult, {}));
  }

  const ghAvailable = runListResult.ok && (!latestMainRun?.databaseId || runViewResult?.ok);
  if (!ghAvailable && !config.allowGhFailure) {
    throw new Error(redacted(runListResult.stderr || runViewResult?.stderr || "GitHub deployment status query failed"));
  }

  const payload = {
    ok: health.ok && (ghAvailable || config.allowGhFailure),
    generatedAt: new Date().toISOString(),
    source: "github_actions_and_public_health",
    config: {
      repo: config.repo,
      branch: config.branch,
      baseUrl: config.baseUrl,
      workflowName: TARGET_WORKFLOW,
      deployJobName: DEPLOY_JOB_NAME,
      maxQueuedMinutes: config.maxQueuedMinutes,
    },
    github: {
      available: ghAvailable,
      runListOk: runListResult.ok,
      runViewOk: runViewResult ? runViewResult.ok : null,
      note: ghAvailable ? "" : redacted(runListResult.stderr || runViewResult?.stderr || "GitHub status unavailable"),
      latestMainRun,
      jobs,
    },
    health: {
      ok: health.ok,
      status: health.status,
      latencyMs: health.latencyMs,
      version: health.body?.version || null,
      checks: health.body?.checks || null,
      error: health.error || null,
    },
    summary: buildSummary({ latestMainRun, jobs, health, config, ghAvailable }),
  };

  await mkdir(config.outDir, { recursive: true });
  const outputPath = path.join(config.outDir, `yishun-deployment-status-${dayStamp()}.json`);
  const evidencePath = path.join(config.outDir, `yishun-deployment-status-${isoStamp()}.json`);
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeFile(evidencePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    ok: payload.ok,
    outputPath,
    evidencePath,
    risk: payload.summary.risk,
    releaseLag: payload.summary.releaseLag,
    productionVersion: payload.summary.productionVersion,
    expectedMainSha: payload.summary.expectedMainSha,
    deployJobStatus: payload.summary.deployJobStatus,
    deployQueuedMinutes: payload.summary.deployQueuedMinutes,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
