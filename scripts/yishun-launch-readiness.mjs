#!/usr/bin/env node
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const args = new Set(process.argv.slice(2));

if (args.has("--help")) {
  console.log(`Usage:
  npm run launch:readiness
  npm run launch:readiness:full

Default gates are no-network/local-safe and stop on first failure.
Use --full to add the production build gate.
Use --consumer-ai-qa to add browser QA from mobile consumer personas.`);
  process.exit(0);
}

const runNpm = (script) => ({
  command: npm,
  args: ["run", script, "--silent"],
});

const gates = [
  ["lint", runNpm("lint")],
  ["typecheck", runNpm("typecheck")],
  ["consumer copy smoke", runNpm("smoke:consumer-copy")],
  ["production config audit", runNpm("audit:production-config")],
  ["analytics contract audit", runNpm("audit:analytics-contract")],
  ["monitoring contract audit", runNpm("audit:monitoring-contract")],
  ["growth ops contract audit", runNpm("audit:growth-ops")],
  ["stripe payment contract audit", runNpm("audit:stripe-contract")],
  ["payment entitlement smoke", runNpm("smoke:p0-payment-entitlement")],
  ["stripe webhook entitlement smoke", runNpm("smoke:stripe-webhook")],
  ["stripe secret literal check", { command: process.execPath, args: ["scripts/stripe-sandbox-secret-check.mjs"] }],
  ["foundation smoke", runNpm("test")],
];

if (args.has("--full")) {
  gates.push(["production build", runNpm("build")]);
}

if (args.has("--consumer-ai-qa")) {
  gates.push(["consumer-grade AI user QA", runNpm("qa:consumer-ai")]);
}

function runGate(name, command, commandArgs) {
  return new Promise((resolve) => {
    const started = performance.now();
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.on("close", (code, signal) => {
      resolve({
        name,
        code,
        signal,
        durationSeconds: Number(((performance.now() - started) / 1000).toFixed(1)),
      });
    });
  });
}

const results = [];
const started = performance.now();

console.log(`[launch:readiness] Starting ${gates.length} gates${args.has("--full") ? " with build" : ""}.`);

for (const [name, gate] of gates) {
  console.log(`\n[launch:readiness] ${name}`);
  const result = await runGate(name, gate.command, gate.args);
  results.push(result);

  if (result.code !== 0) {
    console.error(`\n[launch:readiness] FAILED: ${name}`);
    console.error(JSON.stringify({ ok: false, failedGate: result, results }, null, 2));
    process.exit(result.code ?? 1);
  }
}

console.log(`\n[launch:readiness] PASSED in ${Number(((performance.now() - started) / 1000).toFixed(1))}s`);
console.log(JSON.stringify({
  ok: true,
  full: args.has("--full"),
  gates: results,
}, null, 2));
