#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const scannedRoots = ["app", "lib/i18n.ts", "lib/support-feedback.ts"];
const extensions = new Set([".ts", ".tsx"]);
const forbidden = [
  /P0 (?:notice|stage|build|keeps|accepts|entry points|placeholder)/i,
  /P0 阶段/,
  /internal staging/i,
  /repo state/i,
  /production support desk/i,
  /V1 local mock/i,
  /local mock API/i,
  /mock API returns/i,
  /mocked rewarded/i,
  /Test checkout/i,
  /Payment test/i,
  /This success page confirms/i,
  /Google OAuth redirect loop/i,
  /Fix Google OAuth/i,
];

const ignoredFiles = new Set([
  "app/api/kanban/status/route.ts",
]);

function listFiles(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];
  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const next = path.join(absolute, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path.relative(root, next)));
    else if (extensions.has(path.extname(entry.name))) files.push(next);
  }
  return files;
}

const findings = [];
for (const target of scannedRoots) {
  for (const file of listFiles(target)) {
    const relative = path.relative(root, file);
    if (ignoredFiles.has(relative)) continue;
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of forbidden) {
        if (pattern.test(line)) {
          findings.push(`${relative}:${index + 1}: ${line.trim()}`);
          break;
        }
      }
    });
  }
}

if (findings.length > 0) {
  console.error("Consumer copy smoke found internal/test wording:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("PASS consumer-copy-smoke");
