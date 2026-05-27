#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || "/Users/xiajarvan/.openclaw/workspace/opc-evidence/yishun-gemini-hybrid-implementation-20260514";

const requestBody = {
  birthDate: "1990-01-01",
  birthTime: "17:08",
  birthTimeKnown: true,
  birthPlaceText: "Beijing, China",
  longitude: null,
  latitude: null,
  timezoneOffsetMinutes: -480,
  timezoneName: "Asia/Shanghai",
  gender: "female",
  locale: "en",
  focus: "General",
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function callPreview(label, headers = {}, body = requestBody) {
  const response = await fetch(`${BASE}/api/bazi/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${label}: ${response.status} ${text}`);
  const data = JSON.parse(text);
  fs.writeFileSync(path.join(EVIDENCE_DIR, `${label}.json`), JSON.stringify(data, null, 2));
  return data;
}

function assertCoreFactsStable(base, candidate, label) {
  for (const key of ["dailySignal", "freeSummary", "lockedModules", "trueSolarTime"]) {
    const left = JSON.stringify(base[key]);
    const right = JSON.stringify(candidate[key]);
    if (left !== right) throw new Error(`${label}: core fact changed: ${key}`);
  }
}

function assertAiOk(data, label) {
  if (data.ai?.status !== "ok") throw new Error(`${label}: expected ai.status=ok, got ${JSON.stringify(data.ai)}`);
  if (!Array.isArray(data.ai.actionSuggestions) || data.ai.actionSuggestions.length !== 3) throw new Error(`${label}: expected 3 action suggestions`);
  if (/Powered by Google Gemini/i.test(JSON.stringify(data))) throw new Error(`${label}: misleading Powered by Google Gemini copy found`);
}

function assertFallback(data, reason, label) {
  if (data.ai?.status === "locked") {
    if (data.ai.reason !== "full_report_required") throw new Error(`${label}: expected full_report_required lock, got ${JSON.stringify(data.ai)}`);
    return;
  }
  if (data.ai?.status !== "fallback") throw new Error(`${label}: expected fallback, got ${JSON.stringify(data.ai)}`);
  if (data.ai.reason !== reason) throw new Error(`${label}: expected reason=${reason}, got ${data.ai.reason}`);
  if (!data.dailySignal?.score || !data.dailySignal?.bestHour) throw new Error(`${label}: rules fallback did not include dailySignal`);
}

async function main() {
  ensureDir(EVIDENCE_DIR);
  const defaultDisabled = await callPreview("gemini-default-disabled");
  assertFallback(defaultDisabled, "disabled", "default-disabled");

  const disabled = await callPreview("gemini-explicit-disabled", {}, { ...requestBody, enableAi: false });
  assertFallback(disabled, "disabled", "explicit-disabled");
  assertCoreFactsStable(defaultDisabled, disabled, "explicit-disabled");

  const success = await callPreview("gemini-mock-success", { "x-yishun-gemini-mock": "success" }, { ...requestBody, enableAi: true });
  if (success.ai?.status === "locked") {
    if (success.ai.reason !== "full_report_required") throw new Error(`success: expected full_report_required lock, got ${JSON.stringify(success.ai)}`);
  } else {
    assertAiOk(success, "success");
  }
  assertCoreFactsStable(disabled, success, "success");

  const invalid = await callPreview("gemini-mock-invalid-json", { "x-yishun-gemini-mock": "invalid-json" }, { ...requestBody, enableAi: true });
  assertFallback(invalid, "invalid_json", "invalid-json");
  assertCoreFactsStable(disabled, invalid, "invalid-json");

  const failure = await callPreview("gemini-mock-failure", { "x-yishun-gemini-mock": "failure" }, { ...requestBody, enableAi: true });
  assertFallback(failure, "api_error", "failure");
  assertCoreFactsStable(disabled, failure, "failure");

  const timeout = await callPreview("gemini-mock-timeout", { "x-yishun-gemini-mock": "timeout" }, { ...requestBody, enableAi: true });
  assertFallback(timeout, "timeout", "timeout");
  assertCoreFactsStable(disabled, timeout, "timeout");

  const guardReason = process.env.EXPECT_GEMINI_GUARD_REASON;
  if (guardReason) {
    const guarded = await callPreview(`gemini-guard-${guardReason}`, {}, { ...requestBody, enableAi: true, focus: `Guard ${guardReason}` });
    assertFallback(guarded, guardReason, `guard-${guardReason}`);
    assertCoreFactsStable(disabled, guarded, `guard-${guardReason}`);
  }

  const summary = {
    base: BASE,
    checks: ["default enableAi omitted fallback", "enableAi=false fallback", "mock Gemini success", "invalid JSON fallback", "timeout fallback", "API failure fallback", "core facts stable", ...(guardReason ? [`cost guard ${guardReason}`] : [])],
    evidenceDir: EVIDENCE_DIR,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(EVIDENCE_DIR, "gemini-hybrid-smoke-summary.json"), JSON.stringify(summary, null, 2));
  console.log("PASS gemini-hybrid-smoke");
  console.log(`Evidence: ${EVIDENCE_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
