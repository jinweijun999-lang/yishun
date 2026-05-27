import { NextRequest, NextResponse } from "next/server";
import { evaluateReportQuality } from "@/lib/report-quality-gate";

const ORACLE_LINES = [
  {
    id: "oracle-quiet-growth",
    title: "Quiet growth",
    summary: "A calm step is stronger than a dramatic promise today.",
    action: "Choose one practical action you can finish in the next 30 minutes.",
    basis: "Daily ritual uses YiShun reflection rules only; it does not read private birth data or make deterministic claims.",
  },
  {
    id: "oracle-clear-boundary",
    title: "Clear boundary",
    summary: "The useful signal is to simplify before you commit.",
    action: "Write the condition that must be true before you say yes.",
    basis: "This safe minimum oracle is a non-persistent reflective tool and can later connect to BaZi timing context.",
  },
  {
    id: "oracle-steady-return",
    title: "Steady return",
    summary: "Return to the plan that already has traction instead of opening a new front.",
    action: "Review the last saved YiShun signal and carry one unfinished next step forward.",
    basis: "The result is deterministic local ritual copy, not Gemini and not paid execution.",
  },
];

function pickLine(seed: string | null) {
  const source = seed || new Date().toISOString().slice(0, 10);
  const total = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ORACLE_LINES[total % ORACLE_LINES.length];
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "oracle";
  const seed = request.nextUrl.searchParams.get("seed");
  const line = pickLine(seed);
  const ctas = {
    save: "Save this ritual with today’s signal",
    share: "Share a privacy-safe ritual card",
  };

  const quality = evaluateReportQuality({
    summary: line.summary,
    emotionalValue: line.summary,
    actionAdvice: line.action,
    explanationBasis: line.basis,
    saveCta: ctas.save,
    shareCta: ctas.share,
  });

  return NextResponse.json({
    ok: true,
    type,
    safety: {
      persistence: "none",
      paidExecution: false,
      aiUsed: false,
      disclaimer: "For reflection only. Not financial, medical, legal, or life-critical advice.",
    },
    ritual: {
      ...line,
      method: type === "coins" ? "Three-coin reflection" : type === "draw" ? "Daily draw" : "Oracle line",
      ctas,
    },
    quality,
  });
}
