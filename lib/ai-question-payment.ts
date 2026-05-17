export type QuestionEntitlement = {
  allowed: boolean;
  reason: "included" | "has_credit" | "needs_credit" | "confirm_required";
  creditsRequired: number;
  currentCredits: number;
  chargeNow: false;
};

export type PaidQuestionInput = {
  userId: string;
  question: string;
  creditsBefore: number;
  confirmed: boolean;
  mode?: "mock" | "sandbox" | "live";
};

export type PaidQuestionResult = {
  executionId: string;
  status: "completed" | "failed" | "rolled_back";
  chargePerformed: false;
  creditsBefore: number;
  creditsAfter: number;
  adapter: "mock-safe-v1";
  answer?: {
    summary: string;
    reasoning: string[];
    action: string;
    disclaimer: string;
  };
  rollback?: {
    required: boolean;
    completed: boolean;
    reason: string;
  };
  futureLiveAdapter: {
    contract: "reserve-credit -> execute-reading -> capture-credit | release-reservation";
    idempotencyKey: string;
  };
};

export interface PaidQuestionAdapter {
  execute(input: PaidQuestionInput): Promise<PaidQuestionResult>;
}

function makeExecutionId(userId: string, question: string) {
  const seed = `${userId}:${question}:${new Date().toISOString().slice(0, 10)}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return `mock_q_${hash.toString(16).padStart(8, "0")}`;
}

export const mockPaidQuestionAdapter: PaidQuestionAdapter = {
  async execute(input) {
    const executionId = makeExecutionId(input.userId, input.question);
    const idempotencyKey = `${executionId}:v1`;

    if (!input.confirmed) {
      return {
        executionId,
        status: "failed",
        chargePerformed: false,
        creditsBefore: input.creditsBefore,
        creditsAfter: input.creditsBefore,
        adapter: "mock-safe-v1",
        rollback: { required: false, completed: true, reason: "CONFIRMATION_REQUIRED" },
        futureLiveAdapter: { contract: "reserve-credit -> execute-reading -> capture-credit | release-reservation", idempotencyKey },
      };
    }

    if (input.creditsBefore < 1) {
      return {
        executionId,
        status: "failed",
        chargePerformed: false,
        creditsBefore: input.creditsBefore,
        creditsAfter: input.creditsBefore,
        adapter: "mock-safe-v1",
        rollback: { required: false, completed: true, reason: "NO_CREDIT_AVAILABLE" },
        futureLiveAdapter: { contract: "reserve-credit -> execute-reading -> capture-credit | release-reservation", idempotencyKey },
      };
    }

    if (/simulate[_\s-]?failure|mock[_\s-]?fail/i.test(input.question)) {
      return {
        executionId,
        status: "rolled_back",
        chargePerformed: false,
        creditsBefore: input.creditsBefore,
        creditsAfter: input.creditsBefore,
        adapter: "mock-safe-v1",
        rollback: { required: true, completed: true, reason: "MOCK_EXECUTION_FAILURE_RELEASED_RESERVATION" },
        futureLiveAdapter: { contract: "reserve-credit -> execute-reading -> capture-credit | release-reservation", idempotencyKey },
      };
    }

    return {
      executionId,
      status: "completed",
      chargePerformed: false,
      creditsBefore: input.creditsBefore,
      creditsAfter: input.creditsBefore,
      adapter: "mock-safe-v1",
      answer: {
        summary: "The safer move is to ask one focused question, then wait for a clear response before escalating.",
        reasoning: [
          "V1 mock execution reserves the right to charge in a future live adapter, but does not deduct credits now.",
          "The response stays reflective and timing-oriented, not deterministic or financial/legal/medical advice.",
          "If the live adapter fails after reservation, the contract releases the reservation before returning an error.",
        ],
        action: "Write the exact outcome you want, send one concise message, and review the response after a cooling-off window.",
        disclaimer: "For entertainment and self-reflection only; no medical, legal, financial, investment, or life-critical advice.",
      },
      futureLiveAdapter: { contract: "reserve-credit -> execute-reading -> capture-credit | release-reservation", idempotencyKey },
    };
  },
};
