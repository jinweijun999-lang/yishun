import { NextRequest, NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyticsEventDictionary, checkQuestionEntitlement, promptTemplates } from "@/lib/platform-foundation";
import { mockPaidQuestionAdapter } from "@/lib/ai-question-payment";
import { stripeSandboxCheckoutAdapter } from "@/lib/stripe-sandbox-adapter";
import { logServerError } from "@/lib/error-logging";

export async function GET(request: NextRequest) {
  const session = await getSessionPayload(request);
  if (!session) {
    return NextResponse.json({ authenticated: false, entitlement: checkQuestionEntitlement(0, false) });
  }
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  return NextResponse.json({
    authenticated: true,
    credits: user?.consultationCredits ?? 0,
    entitlement: checkQuestionEntitlement(user?.consultationCredits ?? 0, false),
    paymentFlow: "precheck -> explicit confirmation -> sandbox checkout adapter -> mock paid execution -> rollback on failure; no credits deducted before explicit execution",
    noDeductionGuarantee: "No Ask Credit is deducted during precheck, confirmation, or checkout preparation. A credit is reserved only for explicit execute=true and is returned on failed execution.",
    stripeSandbox: {
      chargePerformed: false,
      requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionPayload(request);
    if (!session) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }
    const body = await request.json();
    const confirmed = body.confirmed === true;
    const execute = body.execute === true;
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
    if (question.length < 8) {
      return NextResponse.json({ error: "QUESTION_TOO_SHORT" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    const credits = user?.consultationCredits ?? 0;
    const entitlement = checkQuestionEntitlement(credits, confirmed);

    if (!execute) {
      const checkout = confirmed
        ? await stripeSandboxCheckoutAdapter.createCheckout({
            userId: session.sub,
            product: "ai_question_credit",
            successUrl: "/ai-question",
            cancelUrl: "/ai-question",
            idempotencyKey: `ai-question:${session.sub}:${question}`,
            mode: "sandbox",
          })
        : null;

      return NextResponse.json({
        event: confirmed ? analyticsEventDictionary.aiQuestionConfirmIntent : analyticsEventDictionary.aiQuestionPrecheck,
        step: confirmed ? "confirmation_captured" : "precheck_only",
        entitlement,
        chargePerformed: false,
        checkout,
        noDeductionGuarantee: "No Ask Credit is deducted during precheck, confirmation, or checkout preparation. A credit is reserved only for explicit execute=true and is returned on failed execution.",
        preview: {
          question,
          status: entitlement.allowed ? "ready_for_mock_paid_execution" : confirmed ? "sandbox_checkout_ready_no_charge" : "precheck_only",
          safetyTemplate: promptTemplates.aiQuestionSafety,
          message: entitlement.allowed
            ? "Entitlement confirmed. Continue to mock paid execution. V1 will not deduct credits."
            : confirmed
              ? "Sandbox checkout adapter is prepared for configuration; it does not read secrets or charge in V1."
              : "Review the credit requirement and confirm before any paid execution. No credit has been deducted.",
        },
      });
    }

    if (!entitlement.allowed) {
      return NextResponse.json({
        error: entitlement.reason === "confirm_required" ? "CONFIRM_REQUIRED" : "ASK_CREDIT_REQUIRED",
        step: "entitlement_blocked",
        entitlement,
        chargePerformed: false,
        message: "AI Question requires 1 ask credit and explicit confirmation. No execution was started.",
      }, { status: entitlement.reason === "confirm_required" ? 400 : 402 });
    }

    const reservation = await prisma.user.updateMany({
      where: { id: session.sub, consultationCredits: { gte: 1 } },
      data: { consultationCredits: { decrement: 1 } },
    });

    if (reservation.count !== 1) {
      return NextResponse.json({
        error: "ASK_CREDIT_REQUIRED",
        step: "credit_reservation_failed",
        entitlement: checkQuestionEntitlement(0, confirmed),
        chargePerformed: false,
        message: "No ask credit was available to reserve. Please buy a credit or membership first.",
      }, { status: 402 });
    }

    const execution = await mockPaidQuestionAdapter.execute({
      userId: session.sub,
      question,
      creditsBefore: credits,
      confirmed,
      mode: "mock",
    });

    const shouldRollback = execution.status !== "completed";
    if (shouldRollback) {
      await prisma.user.update({
        where: { id: session.sub },
        data: { consultationCredits: { increment: 1 } },
      });
    }

    const executionWithCreditState = {
      ...execution,
      creditsAfter: shouldRollback ? credits : credits - 1,
      creditConsumed: !shouldRollback,
      rollback: shouldRollback
        ? { required: true, completed: true, reason: execution.rollback?.reason ?? "EXECUTION_FAILED_CREDIT_RETURNED" }
        : execution.rollback,
    };

    return NextResponse.json({
      event: shouldRollback ? analyticsEventDictionary.aiQuestionMockRollback : analyticsEventDictionary.aiQuestionMockPaidExecute,
      step: "ask_credit_execution",
      entitlement: checkQuestionEntitlement(shouldRollback ? credits : credits - 1, true),
      execution: executionWithCreditState,
      chargePerformed: false,
      safetyTemplate: promptTemplates.aiQuestionSafety,
      noDeductionGuarantee: "No Ask Credit is deducted during precheck, confirmation, or checkout preparation. A credit is reserved only for explicit execute=true and is returned on failed execution.",
      creditPolicy: shouldRollback
        ? "Execution failed or rolled back; the reserved ask credit was returned."
        : "This successful AI Question consumed 1 ask credit. Buying credits is separate from Full Report unlock.",
    }, { status: shouldRollback ? 409 : 200 });
  } catch (error) {
    const safe = await logServerError({
      scope: "server",
      route: "/api/ai-question",
      message: error instanceof Error ? error.message : "AI_QUESTION_FAILED",
      code: "AI_QUESTION_FAILED",
    });
    return NextResponse.json({ error: "AI_QUESTION_FAILED", traceId: safe.traceId, chargePerformed: false }, { status: 500 });
  }
}
