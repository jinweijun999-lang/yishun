#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_REPO = "jinweijun999-lang/yishun";
const DEFAULT_PROJECT = "bazifortune";
const DEFAULT_ZONE = "us-west2-c";
const DEFAULT_INSTANCE = "instance-20260422-173030";
const DEFAULT_BASE_URL = "https://11263.com";
const DEFAULT_OUTBOX = "/Users/xiajarvan/.openclaw/workspace/codex-bridge/outbox";
const DEFAULT_FALLBACK = "/Users/xiajarvan/Documents/流量矩阵/ops/reports";
const DEFAULT_EVIDENCE_DIR = "reports/evidence";
const TIME_ZONE = "Asia/Shanghai";

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
    project: valueFor("--project", process.env.YISHUN_GCP_PROJECT || DEFAULT_PROJECT),
    zone: valueFor("--zone", process.env.YISHUN_GCP_ZONE || DEFAULT_ZONE),
    instance: valueFor("--instance", process.env.YISHUN_GCP_INSTANCE || DEFAULT_INSTANCE),
    baseUrl: valueFor("--base-url", process.env.YISHUN_PRODUCTION_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    outboxDir: valueFor("--outbox-dir", process.env.CODEX_BRIDGE_OUTBOX || DEFAULT_OUTBOX),
    fallbackDir: valueFor("--fallback-dir", process.env.YISHUN_OPS_REPORT_FALLBACK_DIR || DEFAULT_FALLBACK),
    evidenceDir: valueFor("--evidence-dir", process.env.YISHUN_RUNNER_DIAGNOSTIC_EVIDENCE_DIR || DEFAULT_EVIDENCE_DIR),
    watchedWorkflows: (valueFor("--watched-workflows", process.env.YISHUN_WATCHED_WORKFLOWS || "Next.js CI/CD,YiShun Daily Ops Export"))
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    maxQueuedMinutes: Number(valueFor("--max-queued-minutes", process.env.YISHUN_MAX_QUEUED_MINUTES || "10")),
    troubleshoot: args.has("--troubleshoot") || process.env.YISHUN_RUNNER_DIAGNOSTIC_TROUBLESHOOT === "1",
    failOnBlocker: args.has("--fail-on-blocker"),
    help: args.has("--help") || args.has("-h"),
  };
}

function usage() {
  console.log(`Usage:
  npm run ops:runner-diagnostic
  npm run ops:runner-diagnostic -- --troubleshoot
  npm run ops:runner-diagnostic -- --max-queued-minutes=10

Collects non-destructive YiShun self-hosted runner recovery evidence:
- GitHub runner inventory and queued workflows
- GCP VM metadata and direct SSH reachability
- optional gcloud SSH troubleshooting
- production /api/health status

The command writes JSON evidence plus a bridge outbox report.`);
}

function redact(text) {
  return String(text || "")
    .replace(/gh[pousr]_[A-Za-z0-9_]+/g, "[redacted-github-token]")
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "[redacted-google-token]")
    .replace(/sk_(test|live)_[A-Za-z0-9_]+/g, "sk_$1_[redacted]")
    .replace(/whsec_[A-Za-z0-9_]+/g, "whsec_[redacted]");
}

function trim(text, max = 2 * 1024 * 1024) {
  const redacted = redact(text);
  if (redacted.length <= max) return redacted;
  return `${redacted.slice(0, max)}\n[truncated ${redacted.length - max} chars]`;
}

async function runCommand(command, args, { timeoutMs = 20000 } = {}) {
  const started = Date.now();
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 2,
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: "1" },
    });
    return {
      ok: true,
      code: 0,
      durationMs: Date.now() - started,
      command: [command, ...args],
      stdout: trim(stdout),
      stderr: trim(stderr),
    };
  } catch (error) {
    return {
      ok: false,
      code: typeof error?.code === "number" ? error.code : null,
      signal: error?.signal || null,
      durationMs: Date.now() - started,
      command: [command, ...args],
      stdout: trim(error?.stdout || ""),
      stderr: trim(error?.stderr || error?.message || ""),
    };
  }
}

async function fetchJson(url, timeoutMs = 10000) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "user-agent": "yishun-runner-recovery-diagnostic/1.0" },
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

function summarizeRunner(runnerPayload) {
  const runners = Array.isArray(runnerPayload?.runners) ? runnerPayload.runners : [];
  const yishunRunner = runners.find((runner) => runner.name === "yishun-prod-runner") || null;
  return {
    found: Boolean(yishunRunner),
    name: yishunRunner?.name || "yishun-prod-runner",
    status: yishunRunner?.status || "unknown",
    busy: yishunRunner?.busy ?? null,
    labels: (yishunRunner?.labels || []).map((label) => label.name).filter(Boolean),
  };
}

function queueAgeMinutes(run, now = new Date()) {
  const createdAt = new Date(run.created_at || run.createdAt || now);
  return Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 60000));
}

function summarizeQueuedRuns(runs, config) {
  return (Array.isArray(runs) ? runs : [])
    .filter((run) => run.status === "queued")
    .filter((run) => config.watchedWorkflows.includes(run.name || run.workflowName))
    .map((run) => ({
      databaseId: run.id || run.databaseId,
      runNumber: run.run_number || run.runNumber,
      workflowName: run.name || run.workflowName,
      displayTitle: run.display_title || run.displayTitle,
      headBranch: run.head_branch || run.headBranch,
      headSha: run.head_sha || run.headSha,
      createdAt: run.created_at || run.createdAt,
      queuedMinutes: queueAgeMinutes(run),
      stale: queueAgeMinutes(run) > config.maxQueuedMinutes,
      url: run.html_url || run.url,
    }));
}

function mergeQueuedRuns(...groups) {
  const byId = new Map();
  for (const group of groups) {
    for (const run of group) {
      const key = run.databaseId || `${run.workflowName}:${run.runNumber || run.createdAt}`;
      byId.set(key, { ...byId.get(key), ...run });
    }
  }
  return [...byId.values()].sort((a, b) => b.queuedMinutes - a.queuedMinutes);
}

function blockerSummary({ runner, queuedRuns, sshDirect, health }) {
  const blockers = [];
  const watch = [];
  const staleQueuedRuns = queuedRuns.filter((run) => run.stale);
  const latestQueuedReleaseRun = queuedRuns.find((run) => run.headBranch === "main" && run.workflowName === "Next.js CI/CD") || null;
  const productionVersion = health.ok ? health.body?.version || null : null;
  const releaseLag = {
    pending: Boolean(latestQueuedReleaseRun?.headSha && productionVersion && latestQueuedReleaseRun.headSha !== productionVersion),
    productionVersion,
    latestQueuedMainSha: latestQueuedReleaseRun?.headSha || null,
    latestQueuedMainRunUrl: latestQueuedReleaseRun?.url || null,
    latestQueuedMainWorkflow: latestQueuedReleaseRun?.workflowName || null,
    latestQueuedMainQueuedMinutes: latestQueuedReleaseRun?.queuedMinutes ?? null,
  };

  if (runner.status === "offline") blockers.push("GitHub reports yishun-prod-runner offline");
  if (!runner.found) blockers.push("GitHub runner inventory did not include yishun-prod-runner");
  if (staleQueuedRuns.length) blockers.push(`${staleQueuedRuns.length} watched GitHub workflow run(s) are stale-queued behind the runner`);
  if (queuedRuns.length && !staleQueuedRuns.length) watch.push(`${queuedRuns.length} watched GitHub workflow run(s) are queued but inside the stale threshold`);
  if (releaseLag.pending) watch.push(`production release ${productionVersion} is behind queued main release ${latestQueuedReleaseRun.headSha}`);
  if (!sshDirect.ok) blockers.push("Direct gcloud SSH reachability check failed");
  if (health.ok && health.body?.version) watch.push(`production healthy on release ${health.body.version}`);
  if (!health.ok) watch.push("production health check failed or was unavailable");

  return { blocked: blockers.length > 0, blockers, watch, staleQueuedRuns, releaseLag };
}

function summarizeDisk(diskPayload, config) {
  return {
    name: diskPayload?.name || config.instance,
    sizeGb: diskPayload?.sizeGb || null,
    type: diskPayload?.type || null,
    users: diskPayload?.users || [],
  };
}

function summarizeSerialOutput(serialResult) {
  const output = `${serialResult.stdout || ""}\n${serialResult.stderr || ""}`;
  const noSpaceLines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /No space left on device|actions-runner\/_diag|runsvc\.sh/i.test(line))
    .slice(-20);
  const fullDiskDetected = noSpaceLines.some((line) => /No space left on device/i.test(line));

  return {
    ok: serialResult.ok,
    code: serialResult.code,
    fullDiskDetected,
    runnerDiagNoSpace: fullDiskDetected && noSpaceLines.some((line) => /actions-runner\/_diag/i.test(line)),
    lines: noSpaceLines,
    stderr: serialResult.stderr,
  };
}

function enrichSummaryWithGcpEvidence(summary, gcpDisk, serialConsole) {
  const nextActions = [];
  if (serialConsole.runnerDiagNoSpace) {
    summary.blockers.push("Serial console shows GitHub runner crash loop from actions-runner/_diag disk exhaustion");
    nextActions.push("free runner diagnostic/cache space or increase the 10 GB boot disk before restarting the runner service");
  }
  if (gcpDisk.sizeGb) {
    summary.watch.push(`boot disk size is ${gcpDisk.sizeGb} GB`);
  }
  return { ...summary, nextActions };
}

async function writeOutputs(config, payload, markdown) {
  await mkdir(config.evidenceDir, { recursive: true });
  await writeFile(payload.evidencePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const fileName = `${cstStamp()}-yishun-runner-recovery-diagnostic.result.md`;
  try {
    await mkdir(config.outboxDir, { recursive: true });
    const outboxPath = path.join(config.outboxDir, fileName);
    await writeFile(outboxPath, markdown, "utf8");
    return { evidencePath: payload.evidencePath, reportPath: outboxPath, delivery: "bridge_outbox", fallbackUsed: false };
  } catch (error) {
    await mkdir(config.fallbackDir, { recursive: true });
    const fallbackPath = path.join(config.fallbackDir, fileName);
    await writeFile(
      fallbackPath,
      [
        "Bridge outbox write failed; this fallback report preserves the YiShun runner recovery diagnostic.",
        "",
        `Outbox error: ${error instanceof Error ? error.message : "unknown error"}`,
        "",
        markdown,
      ].join("\n"),
      "utf8",
    );
    return { evidencePath: payload.evidencePath, reportPath: fallbackPath, delivery: "fallback_report", fallbackUsed: true };
  }
}

function firstNonEmptyLine(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
}

function markdownReport(config, payload, summary) {
  const latestMainRelease = payload.queuedRuns.find((run) => run.headBranch === "main" && run.workflowName === "Next.js CI/CD") || null;
  const troubleshootingLines = payload.troubleshooting.length
    ? payload.troubleshooting.map((item) => {
      const reason = firstNonEmptyLine(item.stderr);
      return `- ${item.mode}: ${item.ok ? "ok" : "failed"}${reason ? ` (${reason})` : ""}`;
    }).join("\n")
    : "- Skipped; run with `--troubleshoot` to collect gcloud troubleshoot output.";
  const sshReason = firstNonEmptyLine(payload.ssh.direct.stderr);
  const serialLines = payload.serialConsole.lines.length
    ? payload.serialConsole.lines.map((line) => `  - ${line}`).join("\n")
    : "  - no runner disk-exhaustion lines found in serial tail";
  const nextAction = summary.nextActions?.length
    ? summary.nextActions.join("; ")
    : "recover VM SSH or the self-hosted runner service through a non-destructive access path";

  return `# YiShun Runner Recovery Diagnostic - ${cstStamp()}

## Conclusion

${summary.blocked ? "Runner recovery remains blocked." : "Runner recovery checks are clear."}

${summary.blockers.length ? summary.blockers.map((item) => `- ${item}`).join("\n") : "- No runner blocker found from available checks."}

## Evidence

- GitHub runner: ${payload.runner.name} status=${payload.runner.status} busy=${payload.runner.busy}
- Runner labels: ${payload.runner.labels.join(", ") || "unknown"}
- Watched workflows: ${config.watchedWorkflows.join(", ")}
- Max queued minutes: ${config.maxQueuedMinutes}
- Watched queued runs: ${payload.queuedRuns.length}
- Stale watched queued runs: ${payload.summary.staleQueuedRuns.length}
- Latest queued main release run: ${latestMainRelease ? `${latestMainRelease.workflowName} ${latestMainRelease.headSha} ${latestMainRelease.url}` : "none"}
- Release lag: ${payload.summary.releaseLag.pending ? `yes production=${payload.summary.releaseLag.productionVersion} queued_main=${payload.summary.releaseLag.latestQueuedMainSha}` : "no queued main release lag detected"}
- GCP VM: ${payload.gcpInstance.status || "unknown"} ${config.instance} ${config.zone}
- GCP boot disk: ${payload.gcpDisk.sizeGb || "unknown"} GB ${payload.gcpDisk.type || ""}
- Serial disk exhaustion: ${payload.serialConsole.runnerDiagNoSpace ? "yes, runner _diag log writes are failing with No space left on device" : "not detected in serial tail"}
- Direct SSH check: ${payload.ssh.direct.ok ? "ok" : "failed"}${sshReason ? ` (${sshReason})` : ""}
- Production health: ${payload.productionHealth.ok ? `ok version=${payload.productionHealth.body?.version || "unknown"}` : `failed ${payload.productionHealth.error || payload.productionHealth.status || "unknown"}`}
- JSON evidence: \`${payload.evidencePath}\`

## Serial Evidence

${serialLines}

## Troubleshooting

${troubleshootingLines}

## Changed Files

- \`scripts/yishun-runner-recovery-diagnostic.mjs\`

## Verification

- Ran GitHub runner inventory and queued workflow checks with \`gh\`.
- Ran GCP instance metadata and direct SSH reachability checks with \`gcloud\`.
- Checked production \`/api/health\`.
- No PM2 restart, production deploy, real Stripe charge/refund, destructive database operation, force push, or user-data deletion was performed.

## Next Action

${summary.blocked
    ? `${nextAction}, then let the queued main deploy finish and rerun production smoke with the expected main SHA.`
    : "Re-dispatch or monitor the queued main deploy and YiShun Daily Ops Export, then rerun production smoke."}
`;
}

async function main() {
  const config = parseArgs();
  if (config.help) {
    usage();
    return;
  }

  const runnerInventory = await runCommand("gh", ["api", `repos/${config.repo}/actions/runners`]);
  if (!Number.isFinite(config.maxQueuedMinutes) || config.maxQueuedMinutes < 0) {
    throw new Error("--max-queued-minutes must be a non-negative number");
  }

  const runsResult = await runCommand("gh", [
    "api",
    `repos/${config.repo}/actions/runs?status=queued&per_page=100`,
  ]);
  const runsListResult = await runCommand("gh", [
    "run",
    "list",
    "--repo",
    config.repo,
    "--limit",
    "30",
    "--json",
    "databaseId,displayTitle,name,status,conclusion,workflowName,headBranch,headSha,createdAt,updatedAt,url",
  ]);
  const instanceResult = await runCommand("gcloud", [
    "compute",
    "instances",
    "describe",
    config.instance,
    "--project",
    config.project,
    "--zone",
    config.zone,
    "--format=json(name,status,zone,lastStartTimestamp,networkInterfaces[].accessConfigs[].natIP,tags.items)",
  ]);
  const diskResult = await runCommand("gcloud", [
    "compute",
    "disks",
    "describe",
    config.instance,
    "--project",
    config.project,
    "--zone",
    config.zone,
    "--format=json(name,sizeGb,type,users)",
  ]);
  const serialResult = await runCommand("gcloud", [
    "compute",
    "instances",
    "get-serial-port-output",
    config.instance,
    "--project",
    config.project,
    "--zone",
    config.zone,
    "--port=1",
  ], { timeoutMs: 30000 });
  const sshDirect = await runCommand("gcloud", [
    "compute",
    "ssh",
    config.instance,
    "--project",
    config.project,
    "--zone",
    config.zone,
    "--command",
    "true",
    "--ssh-flag=-o BatchMode=yes",
    "--ssh-flag=-o ConnectTimeout=10",
    "--quiet",
  ], { timeoutMs: 30000 });

  const troubleshooting = [];
  if (config.troubleshoot) {
    for (const mode of ["direct", "iap"]) {
      const args = [
        "compute",
        "ssh",
        config.instance,
        "--project",
        config.project,
        "--zone",
        config.zone,
        "--troubleshoot",
        "--ssh-flag=-o BatchMode=yes",
        "--quiet",
      ];
      if (mode === "iap") args.splice(args.indexOf("--troubleshoot"), 0, "--tunnel-through-iap");
      const result = await runCommand("gcloud", args, { timeoutMs: 45000 });
      troubleshooting.push({ mode, ok: result.ok, code: result.code, stdout: result.stdout, stderr: result.stderr });
    }
  }

  const health = await fetchJson(`${config.baseUrl}/api/health`);
  const runner = summarizeRunner(parseJsonResult(runnerInventory, {}));
  const queuedRunsPayload = parseJsonResult(runsResult, {});
  const queuedRunsListPayload = parseJsonResult(runsListResult, []);
  const queuedRuns = mergeQueuedRuns(
    summarizeQueuedRuns(queuedRunsPayload.workflow_runs, config),
    summarizeQueuedRuns(queuedRunsListPayload, config),
  );
  const gcpInstance = parseJsonResult(instanceResult, {});
  const gcpDisk = summarizeDisk(parseJsonResult(diskResult, {}), config);
  const serialConsole = summarizeSerialOutput(serialResult);
  const summary = enrichSummaryWithGcpEvidence(
    blockerSummary({ runner, queuedRuns, sshDirect, health }),
    gcpDisk,
    serialConsole,
  );

  const payload = {
    ok: !summary.blocked,
    checkedAt: new Date().toISOString(),
    evidencePath: path.join(config.evidenceDir, `yishun-runner-recovery-diagnostic-${isoStamp()}.json`),
    config: {
      repo: config.repo,
      project: config.project,
      zone: config.zone,
      instance: config.instance,
      baseUrl: config.baseUrl,
      watchedWorkflows: config.watchedWorkflows,
      maxQueuedMinutes: config.maxQueuedMinutes,
    },
    runner,
    queuedRuns,
    queuedRunSources: {
      apiOk: runsResult.ok,
      listOk: runsListResult.ok,
    },
    gcpInstance: {
      name: gcpInstance?.name || config.instance,
      status: gcpInstance?.status || null,
      lastStartTimestamp: gcpInstance?.lastStartTimestamp || null,
      natIp: gcpInstance?.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || null,
      tags: gcpInstance?.tags?.items || [],
    },
    gcpDisk,
    serialConsole,
    ssh: {
      direct: { ok: sshDirect.ok, code: sshDirect.code, stderr: sshDirect.stderr, stdout: sshDirect.stdout },
    },
    troubleshooting,
    productionHealth: health,
    summary,
  };

  const report = markdownReport(config, payload, summary);
  const outputs = await writeOutputs(config, payload, report);

  console.log(JSON.stringify({
    ok: payload.ok,
    reportPath: outputs.reportPath,
    evidencePath: outputs.evidencePath,
    delivery: outputs.delivery,
    blockers: summary.blockers,
  }, null, 2));

  if (config.failOnBlocker && summary.blocked) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
