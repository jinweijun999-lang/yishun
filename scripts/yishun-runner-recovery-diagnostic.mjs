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
- GitHub waiting workflow states: queued, pending, waiting, requested
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
    .filter((run) => WAITING_RUN_STATUSES.includes(run.status))
    .filter((run) => config.watchedWorkflows.includes(run.name || run.workflowName))
    .map((run) => ({
      databaseId: run.id || run.databaseId,
      runNumber: run.run_number || run.runNumber,
      workflowName: run.name || run.workflowName,
      displayTitle: run.display_title || run.displayTitle,
      headBranch: run.head_branch || run.headBranch,
      headSha: run.head_sha || run.headSha,
      status: run.status,
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
  if (staleQueuedRuns.length) blockers.push(`${staleQueuedRuns.length} watched GitHub workflow run(s) are stale-waiting behind the runner`);
  if (queuedRuns.length && !staleQueuedRuns.length) watch.push(`${queuedRuns.length} watched GitHub workflow run(s) are waiting but inside the stale threshold`);
  if (releaseLag.pending) watch.push(`production release ${productionVersion} is behind queued main release ${latestQueuedReleaseRun.headSha}`);
  if (!sshDirect.ok) blockers.push("Direct gcloud SSH reachability check failed");
  if (health.ok && health.body?.version) watch.push(`production healthy on release ${health.body.version}`);
  if (!health.ok) watch.push("production health check failed or was unavailable");

  return { blocked: blockers.length > 0, blockers, watch, staleQueuedRuns, releaseLag };
}

function lastPathSegment(value) {
  return String(value || "").split("/").filter(Boolean).pop() || "";
}

function summarizeDisk(diskPayload, config, instancePayload = {}) {
  const bootDisk = (instancePayload?.disks || []).find((disk) => disk.boot) || null;
  const bootDiskName = lastPathSegment(bootDisk?.source) || bootDisk?.deviceName || "";
  return {
    name: diskPayload?.name || bootDiskName || config.instance,
    sizeGb: diskPayload?.sizeGb || bootDisk?.diskSizeGb || null,
    type: diskPayload?.type || null,
    users: diskPayload?.users || [],
    source: diskPayload?.selfLink || bootDisk?.source || null,
    fromInstanceMetadata: !diskPayload?.sizeGb && Boolean(bootDisk?.diskSizeGb),
  };
}

function summarizeSerialOutput(serialResult) {
  const output = `${serialResult.stdout || ""}\n${serialResult.stderr || ""}`;
  const noSpaceLines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /No space left on device|actions-runner\/_diag|runsvc\.sh/i.test(line))
    .slice(-20);
  const opsAgentBillingLines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /otelopscol|billing to be enabled|PermissionDenied desc = This API method requires billing/i.test(line))
    .slice(-12);
  const fullDiskDetected = noSpaceLines.some((line) => /No space left on device/i.test(line));
  const opsAgentBillingDisabled = opsAgentBillingLines.some((line) => /billing to be enabled/i.test(line));

  return {
    ok: serialResult.ok,
    code: serialResult.code,
    fullDiskDetected,
    runnerDiagNoSpace: fullDiskDetected && noSpaceLines.some((line) => /actions-runner\/_diag/i.test(line)),
    opsAgentBillingDisabled,
    lines: noSpaceLines,
    opsAgentBillingLines,
    stderr: serialResult.stderr,
  };
}

function enrichSummaryWithGcpEvidence(summary, gcpDisk, serialConsole) {
  const nextActions = [];
  const diskSizeGb = Number(gcpDisk.sizeGb || 0);
  const targetDiskSizeGb = Number.isFinite(diskSizeGb) && diskSizeGb > 0 ? Math.max(diskSizeGb + 10, 20) : 20;
  if (serialConsole.runnerDiagNoSpace) {
    const diskAlreadyExpanded = Number.isFinite(diskSizeGb) && diskSizeGb >= 20;
    summary.blockers.push(
      diskAlreadyExpanded
        ? `Serial console still shows GitHub runner crash loop from actions-runner/_diag disk exhaustion after the boot disk was expanded to ${diskSizeGb} GB`
        : "Serial console shows GitHub runner crash loop from actions-runner/_diag disk exhaustion",
    );
    nextActions.push(
      diskAlreadyExpanded
        ? "grow the guest filesystem or clear runner diagnostic/cache pressure through an SSH, serial console, startup-script, or OS Config access path before restarting the runner service"
        : `free runner diagnostic/cache space or increase the ${diskSizeGb || "current"} GB boot disk toward ${targetDiskSizeGb} GB before restarting the runner service`,
    );
  }
  if (gcpDisk.sizeGb) {
    summary.watch.push(`boot disk size is ${gcpDisk.sizeGb} GB`);
  }
  if (serialConsole.opsAgentBillingDisabled) {
    summary.watch.push("Cloud Ops metrics export is failing because GCP billing is disabled for bazifortune");
  }
  return { ...summary, nextActions };
}

function safeRecoveryPlan(summary, payload) {
  const actions = [];
  const diskSizeGb = Number(payload.gcpDisk?.sizeGb || 0);
  const targetDiskSizeGb = Number.isFinite(diskSizeGb) && diskSizeGb > 0 ? Math.max(diskSizeGb + 10, 20) : 20;
  const diskPressureLikely = payload.serialConsole?.runnerDiagNoSpace || (Number.isFinite(diskSizeGb) && diskSizeGb > 0 && diskSizeGb <= 10);
  const diskAlreadyExpanded = diskPressureLikely && Number.isFinite(diskSizeGb) && diskSizeGb >= 20;
  const diskCapacityStillSmall = diskPressureLikely && (!Number.isFinite(diskSizeGb) || diskSizeGb < 20);

  if (diskCapacityStillSmall) {
    actions.push({
      label: "Increase boot disk capacity",
      owner: "Codex/GCP unattended if IAM permits",
      safe: true,
      blockedBy: "Requires GCP disk resize permission and later filesystem grow access on the VM",
      command: `gcloud compute disks resize ${payload.gcpDisk?.name || payload.config.instance} --project ${payload.config.project} --zone ${payload.config.zone} --size ${targetDiskSizeGb}GB`,
      rollback: "No destructive rollback needed; larger persistent disk can remain attached.",
    });
  }

  if (diskAlreadyExpanded) {
    actions.push({
      label: "Do not repeat disk resize until guest filesystem state is confirmed",
      owner: "Codex/GCP unattended diagnostics",
      safe: true,
      blockedBy: "The boot disk is already expanded; more capacity is unlikely to help until the guest filesystem or runner log/cache pressure is fixed",
      command: `gcloud compute disks describe ${payload.gcpDisk?.name || payload.config.instance} --project ${payload.config.project} --zone ${payload.config.zone} --format='value(sizeGb,status)'`,
      rollback: "No infrastructure change is made by this verification step.",
    });
  }

  if (diskPressureLikely) {
    actions.push({
      label: diskAlreadyExpanded ? "Grow filesystem after disk resize or clear runner-only pressure" : "Grow filesystem after disk resize",
      owner: "Codex/GCP unattended if SSH or serial console access is restored",
      safe: true,
      blockedBy: diskAlreadyExpanded
        ? "Requires SSH, serial console, startup-script, or OS Config execution access; current direct SSH diagnostic is failing"
        : "Current direct SSH diagnostic must pass, or an equivalent non-destructive serial-console access path must be available",
      command: "sudo growpart /dev/sda 1 && sudo resize2fs /dev/sda1",
      rollback: diskAlreadyExpanded
        ? "No user-data deletion; rerun df -h, runner diagnostic, and production health checks after the grow operation."
        : "No data deletion; rerun df -h and production health checks after the grow operation.",
    });
  }

  if (payload.runner?.status === "offline" || payload.summary?.staleQueuedRuns?.length) {
    actions.push({
      label: "Restart GitHub runner service after disk pressure is cleared",
      owner: "Codex/GCP unattended if SSH or runner service access is restored",
      safe: true,
      blockedBy: "Do not restart until disk pressure is cleared and production health is confirmed",
      command: "sudo systemctl restart actions.runner.*.service",
      rollback: "If deployment queue remains stuck, keep production untouched and report runner service logs.",
    });
  }

  if (payload.productionHealth?.ok) {
    actions.push({
      label: "Verify production before and after recovery",
      owner: "Codex",
      safe: true,
      blockedBy: "None while https://11263.com is reachable",
      command: `npm run smoke:production -- --base-url=${payload.config.baseUrl} --label=runner-recovery-verify`,
      rollback: "If smoke fails, avoid deploy/restart and report the failed evidence file.",
    });
  }

  return {
    diskPressureLikely,
    canRecoverUnattended: actions.some((action) =>
      action.safe
      && !/^Verify production/i.test(action.label)
      && action.blockedBy === "None while https://11263.com is reachable"
    ),
    canVerifyUnattended: actions.some((action) => action.safe && action.blockedBy === "None while https://11263.com is reachable"),
    actions,
    boundaries: [
      "Do not delete user data.",
      "Do not force push or rewrite remote history.",
      "Do not perform destructive database operations.",
      "Do not perform Stripe live charges or refunds.",
      "Do not restart production PM2 outside the established deployment or emergency rollback path.",
    ],
    nextUnblockedAction: summary.blocked
      ? "Use the first IAM/SSH-accessible non-destructive recovery action above, then rerun this diagnostic and production smoke."
      : "Monitor queued workflows and rerun production smoke against the expected release SHA.",
  };
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
  const opsAgentLines = payload.serialConsole.opsAgentBillingLines.length
    ? payload.serialConsole.opsAgentBillingLines.map((line) => `  - ${line}`).join("\n")
    : "  - no Cloud Ops billing-disabled lines found in serial tail";
  const nextAction = summary.nextActions?.length
    ? summary.nextActions.join("; ")
    : "recover VM SSH or the self-hosted runner service through a non-destructive access path";
  const recoveryActions = payload.safeRecoveryPlan.actions.length
    ? payload.safeRecoveryPlan.actions.map((action, index) => [
      `${index + 1}. ${action.label}`,
      `   - Owner: ${action.owner}`,
      `   - Safe: ${action.safe ? "yes" : "no"}`,
      `   - Blocked by: ${action.blockedBy}`,
      `   - Command: \`${action.command}\``,
      `   - Rollback: ${action.rollback}`,
    ].join("\n")).join("\n")
    : "No safe recovery action was generated from the available evidence.";
  const recoveryBoundaries = payload.safeRecoveryPlan.boundaries.map((item) => `- ${item}`).join("\n");

  return `# YiShun Runner Recovery Diagnostic - ${cstStamp()}

## Conclusion

${summary.blocked ? "Runner recovery remains blocked." : "Runner recovery checks are clear."}

${summary.blockers.length ? summary.blockers.map((item) => `- ${item}`).join("\n") : "- No runner blocker found from available checks."}

## Evidence

- GitHub runner: ${payload.runner.name} status=${payload.runner.status} busy=${payload.runner.busy}
- Runner labels: ${payload.runner.labels.join(", ") || "unknown"}
- Watched workflows: ${config.watchedWorkflows.join(", ")}
- Waiting statuses: ${WAITING_RUN_STATUSES.join(", ")}
- Max queued minutes: ${config.maxQueuedMinutes}
- Watched waiting runs: ${payload.queuedRuns.length}
- Stale watched waiting runs: ${payload.summary.staleQueuedRuns.length}
- Latest queued main release run: ${latestMainRelease ? `${latestMainRelease.workflowName} ${latestMainRelease.headSha} ${latestMainRelease.url}` : "none"}
- Release lag: ${payload.summary.releaseLag.pending ? `yes production=${payload.summary.releaseLag.productionVersion} queued_main=${payload.summary.releaseLag.latestQueuedMainSha}` : "no queued main release lag detected"}
- GCP VM: ${payload.gcpInstance.status || "unknown"} ${config.instance} ${config.zone}
- GCP boot disk: ${payload.gcpDisk.sizeGb || "unknown"} GB ${payload.gcpDisk.type || ""}
- Serial disk exhaustion: ${payload.serialConsole.runnerDiagNoSpace ? "yes, runner _diag log writes are failing with No space left on device" : "not detected in serial tail"}
- Cloud Ops metrics export: ${payload.serialConsole.opsAgentBillingDisabled ? "billing-disabled failure detected in serial tail" : "no billing-disabled failure detected in serial tail"}
- Direct SSH check: ${payload.ssh.direct.ok ? "ok" : "failed"}${sshReason ? ` (${sshReason})` : ""}
- Production health: ${payload.productionHealth.ok ? `ok version=${payload.productionHealth.body?.version || "unknown"}` : `failed ${payload.productionHealth.error || payload.productionHealth.status || "unknown"}`}
- JSON evidence: \`${payload.evidencePath}\`

## Serial Evidence

${serialLines}

## Monitoring Serial Evidence

${opsAgentLines}

## Troubleshooting

${troubleshootingLines}

## Safe Recovery Plan

- Disk pressure likely: ${payload.safeRecoveryPlan.diskPressureLikely ? "yes" : "no"}
- Can recover unattended: ${payload.safeRecoveryPlan.canRecoverUnattended ? "yes" : "no"}
- Can verify unattended: ${payload.safeRecoveryPlan.canVerifyUnattended ? "yes" : "no"}

${recoveryActions}

### Boundaries

${recoveryBoundaries}

## Changed Files

- \`scripts/yishun-runner-recovery-diagnostic.mjs\`

## Verification

- Ran GitHub runner inventory and waiting workflow checks with \`gh\`.
- Ran GCP instance metadata and direct SSH reachability checks with \`gcloud\`.
- Checked production \`/api/health\`.
- No PM2 restart, production deploy, real Stripe charge/refund, destructive database operation, force push, or user-data deletion was performed.

## Next Action

${summary.blocked
    ? `${nextAction}, then let the waiting main deploy finish and rerun production smoke with the expected main SHA.`
    : "Re-dispatch or monitor the waiting main deploy and YiShun Daily Ops Export, then rerun production smoke."}
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

  const waitingRunApiResults = await Promise.all(WAITING_RUN_STATUSES.map((status) => runCommand("gh", [
    "api",
    `repos/${config.repo}/actions/runs?status=${status}&per_page=100`,
  ])));
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
    "--format=json(name,status,zone,lastStartTimestamp,networkInterfaces[].accessConfigs[].natIP,tags.items,disks[].boot,disks[].source,disks[].deviceName,disks[].diskSizeGb)",
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
  const queuedRunsPayloads = waitingRunApiResults.map((result) => parseJsonResult(result, {}));
  const queuedRunsListPayload = parseJsonResult(runsListResult, []);
  const queuedRuns = mergeQueuedRuns(
    ...queuedRunsPayloads.map((payload) => summarizeQueuedRuns(payload.workflow_runs, config)),
    summarizeQueuedRuns(queuedRunsListPayload, config),
  );
  const gcpInstance = parseJsonResult(instanceResult, {});
  const gcpDisk = summarizeDisk(parseJsonResult(diskResult, {}), config, gcpInstance);
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
      api: Object.fromEntries(WAITING_RUN_STATUSES.map((status, index) => [status, waitingRunApiResults[index]?.ok || false])),
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
  payload.safeRecoveryPlan = safeRecoveryPlan(summary, payload);

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
