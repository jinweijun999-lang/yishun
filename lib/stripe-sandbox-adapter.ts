export type StripeSandboxProduct = "report_single" | "premium_monthly" | "premium_annual" | "consultation_single" | "ai_question_credit";

export type StripeSandboxCheckoutInput = {
  userId: string;
  product: StripeSandboxProduct;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
  mode?: "mock" | "sandbox";
};

export type StripeSandboxCheckoutResult = {
  ok: true;
  provider: "stripe";
  mode: "mock" | "sandbox";
  chargePerformed: false;
  checkoutSessionId: string;
  redirectUrl: string;
  requiredEnv: string[];
  safety: "no_secret_read_no_live_charge";
};

export interface StripeCheckoutAdapter {
  createCheckout(input: StripeSandboxCheckoutInput): Promise<StripeSandboxCheckoutResult>;
}

function stableSessionId(seed: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `cs_sandbox_mock_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function sanitizeReturnUrl(url: string) {
  if (!/^https?:\/\//.test(url) && !url.startsWith("/")) {
    throw new Error("UNSAFE_RETURN_URL");
  }
  return url.slice(0, 500);
}

export const stripeSandboxCheckoutAdapter: StripeCheckoutAdapter = {
  async createCheckout(input) {
    const mode = input.mode ?? "mock";
    if (mode !== "mock" && mode !== "sandbox") throw new Error("LIVE_CHARGE_NOT_ALLOWED_IN_V1_LOCAL_ADAPTER");
    if (!input.userId || !input.idempotencyKey) throw new Error("MISSING_IDEMPOTENCY_CONTEXT");

    const checkoutSessionId = stableSessionId(`${input.userId}:${input.product}:${input.quantity ?? 1}:${input.idempotencyKey}`);
    const successUrl = sanitizeReturnUrl(input.successUrl);
    sanitizeReturnUrl(input.cancelUrl);

    return {
      ok: true,
      provider: "stripe",
      mode,
      chargePerformed: false,
      checkoutSessionId,
      redirectUrl: `${successUrl}${successUrl.includes("?") ? "&" : "?"}mock_checkout_session=${checkoutSessionId}`,
      requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
      safety: "no_secret_read_no_live_charge",
    };
  },
};
