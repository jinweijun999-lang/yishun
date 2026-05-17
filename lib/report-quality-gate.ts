export type ReportQualityInput = {
  summary?: string | null;
  emotionalValue?: string | null;
  actionAdvice?: string | null;
  explanationBasis?: string | null;
  saveCta?: string | null;
  shareCta?: string | null;
};

export type ReportQualityGateResult = {
  passed: boolean;
  score: number;
  maxScore: number;
  checks: Array<{
    id: "emotional_value" | "action_advice" | "explanation_basis" | "save_cta" | "share_cta";
    label: string;
    passed: boolean;
    reason: string;
  }>;
};

function hasUsefulText(value: string | null | undefined, minLength = 18) {
  return typeof value === "string" && value.trim().length >= minLength;
}

export function evaluateReportQuality(input: ReportQualityInput): ReportQualityGateResult {
  const checks: ReportQualityGateResult["checks"] = [
    {
      id: "emotional_value",
      label: "Emotional value",
      passed: hasUsefulText(input.emotionalValue ?? input.summary, 24),
      reason: "Report should make the user feel seen without deterministic claims.",
    },
    {
      id: "action_advice",
      label: "Action advice",
      passed: hasUsefulText(input.actionAdvice, 18),
      reason: "Report needs one clear next action or avoid boundary.",
    },
    {
      id: "explanation_basis",
      label: "Explanation basis",
      passed: hasUsefulText(input.explanationBasis, 24),
      reason: "Report must show rules-engine basis: BaZi/Five Elements/timing trace, not black-box AI.",
    },
    {
      id: "save_cta",
      label: "Save CTA",
      passed: hasUsefulText(input.saveCta, 8),
      reason: "Result page must invite saving the signal/history.",
    },
    {
      id: "share_cta",
      label: "Share CTA",
      passed: hasUsefulText(input.shareCta, 8),
      reason: "Result page must invite privacy-safe sharing.",
    },
  ];

  const score = checks.filter((check) => check.passed).length;
  return { passed: score === checks.length, score, maxScore: checks.length, checks };
}

export const consumerGradeReportQualityContract = {
  requiredChecks: ["emotional_value", "action_advice", "explanation_basis", "save_cta", "share_cta"],
  aiRole: "Gemini may enhance high-value personalization only; YiShun rules engine remains the source of chart/timing facts.",
  noGoIfMissing: "Any missing check blocks final consumer-grade acceptance.",
} as const;
