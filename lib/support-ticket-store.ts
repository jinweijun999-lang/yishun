import crypto from "node:crypto";
import { createLocalSupportTicket, type SupportTicketInput } from "@/lib/support-feedback";
import { prisma } from "@/lib/prisma";

const SUPPORT_TICKET_STORAGE_VERSION = "support-ticket-persistence-v1";

export type SupportTicketRecord = ReturnType<typeof createLocalSupportTicket> & {
  createdAt: string;
  messagePreview: string;
  orderId?: string;
  emailPresent: boolean;
  storage: "memory-local-v1" | "db-persistent-v1";
  messageHash?: string;
  emailHash?: string;
};

export interface SupportTicketStore {
  create(input: SupportTicketInput): Promise<SupportTicketRecord>;
  get(id: string): Promise<SupportTicketRecord | null>;
}

const localTickets = new Map<string, SupportTicketRecord>();

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown) {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

export function redactSupportMessage(message: string) {
  return message
    // birth timestamps / DOB-like values are PII and must not be persisted in previews.
    .replace(/\b(?:19|20)\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}(?:日)?\b/g, "[redacted-date]")
    .replace(/\b\d{1,2}[:：]\d{2}\b/g, "[redacted-time]")
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}[:：]\d{2}\b/g, "[redacted-birth-data]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:question|ai question|birth date|birth time|出生|生辰|生日)\s*[:：][^\n。.!?]{8,}/gi, "$1: [redacted]")
    .trim();
}

export function supportMessagePreview(message: string) {
  return redactSupportMessage(message).slice(0, 80);
}

export function supportMessageHash(input: SupportTicketInput) {
  return sha256(stableJson({
    category: input.category,
    // Hashing preserves dedupe/tracking while avoiding full AI question/full birth data persistence.
    message: input.message,
    orderId: input.orderId ?? null,
    locale: input.locale ?? "en",
  }));
}

function emailHash(email?: string) {
  return email ? sha256(email.trim().toLowerCase()) : undefined;
}

function emailDomain(email?: string) {
  if (!email || !email.includes("@")) return undefined;
  return email.split("@").pop()?.toLowerCase().slice(0, 80);
}

function baseRecord(input: SupportTicketInput, storage: SupportTicketRecord["storage"]): SupportTicketRecord {
  const ticket = createLocalSupportTicket(input);
  return {
    ...ticket,
    status: storage === "db-persistent-v1" ? "received" : ticket.status,
    createdAt: new Date().toISOString(),
    messagePreview: supportMessagePreview(input.message),
    messageHash: supportMessageHash(input),
    orderId: input.orderId,
    emailHash: emailHash(input.email),
    emailPresent: Boolean(input.email),
    storage,
    privacy: `${SUPPORT_TICKET_STORAGE_VERSION}: stores only whitelisted support metadata, redacted preview, hashes, tracking id, and optional order id; no full birth data or full AI question.`,
  };
}

export const localSupportTicketStore: SupportTicketStore = {
  async create(input) {
    const record = baseRecord(input, "memory-local-v1");
    localTickets.set(record.id, record);
    return record;
  },
  async get(id) {
    return localTickets.get(id) ?? null;
  },
};

type SupportTicketRow = {
  id: string;
  publicId: string;
  category: string;
  status: string;
  locale: string;
  messagePreview: string;
  messageHash: string;
  orderId: string | null;
  emailHash: string | null;
  createdAt: Date;
};

function rowToRecord(row: SupportTicketRow): SupportTicketRecord {
  return {
    id: row.publicId,
    category: row.category as SupportTicketInput["category"],
    status: row.status,
    nextStep: row.locale === "zh" ? "我们已生成追踪编号，会尽快同步处理。" : "We generated a tracking ID and will follow up as soon as possible.",
    privacy: `${SUPPORT_TICKET_STORAGE_VERSION}: persisted whitelist only; no full birth data or full AI question.`,
    createdAt: row.createdAt.toISOString(),
    messagePreview: row.messagePreview,
    messageHash: row.messageHash,
    orderId: row.orderId ?? undefined,
    emailHash: row.emailHash ?? undefined,
    emailPresent: Boolean(row.emailHash),
    storage: "db-persistent-v1",
  };
}

export const dbSupportTicketStore: SupportTicketStore = {
  async create(input) {
    const record = baseRecord(input, "db-persistent-v1");
    const [row] = await prisma.$queryRaw<SupportTicketRow[]>`
      INSERT INTO "SupportTicket" (
        "publicId", "category", "status", "locale", "messagePreview", "messageHash",
        "orderId", "emailHash", "emailDomain", "sourceRoute", "traceId"
      ) VALUES (
        ${record.id}, ${input.category}, ${record.status}, ${input.locale ?? "en"}, ${record.messagePreview}, ${record.messageHash ?? ""},
        ${input.orderId ?? null}, ${record.emailHash ?? null}, ${emailDomain(input.email) ?? null}, ${"/api/support/feedback"}, ${record.id}
      )
      RETURNING "id", "publicId", "category", "status", "locale", "messagePreview", "messageHash", "orderId", "emailHash", "createdAt"
    `;
    return rowToRecord(row);
  },
  async get(id) {
    const [row] = await prisma.$queryRaw<SupportTicketRow[]>`
      SELECT "id", "publicId", "category", "status", "locale", "messagePreview", "messageHash", "orderId", "emailHash", "createdAt"
      FROM "SupportTicket"
      WHERE "publicId" = ${id}
      LIMIT 1
    `;
    return row ? rowToRecord(row) : null;
  },
};

export function resolveSupportTicketStore(): SupportTicketStore {
  return process.env.SUPPORT_TICKET_STORE === "db" ? dbSupportTicketStore : localSupportTicketStore;
}

export const supportTicketStore = resolveSupportTicketStore();
