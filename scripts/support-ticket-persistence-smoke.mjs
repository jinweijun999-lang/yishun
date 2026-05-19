import { existsSync, readFileSync } from "node:fs";

const checks = [
  ["Support ticket store", "lib/support-ticket-store.ts", [
    "dbSupportTicketStore",
    "resolveSupportTicketStore",
    "SUPPORT_TICKET_STORE === \"db\"",
    "supportMessagePreview",
    "supportMessageHash",
    "[redacted-date]",
    "no full birth data or full AI question",
    "INSERT INTO \"SupportTicket\"",
  ]],
  ["Support feedback route", "app/api/support/feedback/route.ts", [
    "supportTicketStore.create(input)",
    "support-ticket-persistence-v1",
  ]],
  ["Prisma SupportTicket model", "prisma/schema.prisma", [
    "model SupportTicket",
    "publicId       String   @unique",
    "messagePreview String",
    "messageHash    String",
    "emailHash      String?",
  ]],
  ["Generated migration", "prisma/migrations/20260515161000_add_support_tickets/migration.sql", [
    "CREATE TABLE \"SupportTicket\"",
    "CREATE UNIQUE INDEX \"SupportTicket_publicId_key\"",
  ]],
];

const failures = [];
for (const [label, file, needles] of checks) {
  if (!existsSync(file)) {
    failures.push(`${label}: missing ${file}`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${label}: missing ${needle}`);
  }
}

const storeText = readFileSync("lib/support-ticket-store.ts", "utf8");
if (/messageCipher|birthDate|birthTime|dateOfBirth|fullQuestion/.test(storeText)) {
  failures.push("Support ticket store: forbidden full PII persistence token found");
}

if (failures.length) {
  console.error("support-ticket-persistence-smoke failed:\n" + failures.join("\n"));
  process.exit(1);
}

console.log(`support-ticket-persistence-smoke passed (${checks.length} files; create/tracking/redaction coverage by source assertions)`);
