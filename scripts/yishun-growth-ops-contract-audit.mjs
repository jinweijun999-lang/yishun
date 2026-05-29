#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assertContains(file, needle) {
  const text = read(file);
  if (!text.includes(needle)) {
    throw new Error(`${file} is missing ${needle}`);
  }
}

for (const file of [
  "ops/growth/yishun-14-day-launch-calendar.md",
  "ops/growth/yishun-content-seed-pack.md",
  "ops/growth/yishun-growth-dashboard-schema.csv",
]) {
  assertContains(file, "YiShun");
}

for (const channel of ["SEO", "TikTok", "Instagram", "YouTube Shorts", "Reddit", "Xiaohongshu"]) {
  assertContains("ops/growth/yishun-14-day-launch-calendar.md", channel);
}

for (const trackingNeedle of ["utm_source", "utm_medium", "utm_campaign", "reading_start_clicked", "saved_report", "share_clicked", "checkout_started", "entitlement_granted"]) {
  assertContains("ops/growth/yishun-growth-dashboard-schema.csv", trackingNeedle);
  assertContains("scripts/yishun-daily-data-report.mjs", trackingNeedle);
}

for (const copyNeedle of ["self-reflection", "not financial", "not medical", "not legal", "checkout", "save your report", "share"]) {
  assertContains("ops/growth/yishun-content-seed-pack.md", copyNeedle);
}

for (const smokeNeedle of ["Share today", "Save today card", "share_click", "report_view"]) {
  assertContains("scripts/p1-growth-smoke.mjs", smokeNeedle);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "growth_calendar_covers_priority_channels",
        "content_seed_pack_preserves_compliance_and_paid_flow",
        "dashboard_schema_maps_growth_to_daily_analytics",
        "p1_growth_smoke_covers_share_and_saved_report_surfaces",
      ],
    },
    null,
    2,
  ),
);
