export type SupportCategory = "general" | "reading_quality" | "order_payment" | "bug_report";

export type SupportTicketInput = {
  category: SupportCategory;
  message: string;
  orderId?: string;
  email?: string;
  locale?: "en" | "zh";
};

export function normalizeSupportTicket(raw: Record<string, unknown>): SupportTicketInput {
  const allowed: SupportCategory[] = ["general", "reading_quality", "order_payment", "bug_report"];
  const category = allowed.includes(raw.category as SupportCategory) ? raw.category as SupportCategory : "general";
  const message = typeof raw.message === "string" ? raw.message.trim().slice(0, 1200) : "";
  if (message.length < 6) throw new Error("SUPPORT_MESSAGE_TOO_SHORT");
  return {
    category,
    message,
    orderId: typeof raw.orderId === "string" ? raw.orderId.trim().slice(0, 80) : undefined,
    email: typeof raw.email === "string" ? raw.email.trim().slice(0, 120) : undefined,
    locale: raw.locale === "zh" || raw.locale === "zh-CN" ? "zh" : "en",
  };
}

export function createLocalSupportTicket(input: SupportTicketInput) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seed = `${input.category}:${input.message}:${input.orderId ?? ""}:${day}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return {
    id: `YS-${day}-${(hash >>> 0).toString(16).toUpperCase().slice(0, 6)}`,
    category: input.category,
    status: "received_local_mock",
    nextStep: input.locale === "zh" ? "我们已生成追踪编号；正式客服系统接入后会同步工单。" : "We generated a tracking ID; the production support desk can sync this ticket later.",
    privacy: "V1 local mock does not persist payment secrets, tokens, cookies, or full private profile data.",
  };
}
