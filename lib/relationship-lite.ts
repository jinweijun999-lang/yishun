import { buildPreviewChart, generateDailySignal, normalizeBirthProfileInput } from "@/lib/p0-astrology";

type RawProfile = Record<string, unknown>;

const ELEMENT_FLOW: Record<string, { supports: string; challengedBy: string }> = {
  Wood: { supports: "Fire", challengedBy: "Metal" },
  Fire: { supports: "Earth", challengedBy: "Water" },
  Earth: { supports: "Metal", challengedBy: "Wood" },
  Metal: { supports: "Water", challengedBy: "Fire" },
  Water: { supports: "Wood", challengedBy: "Earth" },
};

export type RelationshipLiteResult = {
  summary: string;
  score: number;
  sharedFocus: string;
  supportiveSignal: string;
  frictionSignal: string;
  nextStep: string;
  privacyNote: string;
  trace: Array<{ label: string; value: string }>;
};

function cleanName(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 24) : fallback;
}

export function computeRelationshipLite(selfRaw: RawProfile, partnerRaw: RawProfile): RelationshipLiteResult {
  const self = buildPreviewChart(normalizeBirthProfileInput(selfRaw));
  const partner = buildPreviewChart(normalizeBirthProfileInput(partnerRaw));
  const selfName = cleanName(selfRaw.name, "You");
  const partnerName = cleanName(partnerRaw.name, "Partner");
  const selfElement = self.favorableElement;
  const partnerElement = partner.favorableElement;
  const selfFlow = ELEMENT_FLOW[selfElement] ?? ELEMENT_FLOW.Wood;
  const partnerFlow = ELEMENT_FLOW[partnerElement] ?? ELEMENT_FLOW.Wood;
  const directSupport = selfFlow.supports === partnerElement || partnerFlow.supports === selfElement;
  const directChallenge = selfFlow.challengedBy === partnerElement || partnerFlow.challengedBy === selfElement;
  const dayMasterMatch = self.profile.day_master === partner.profile.day_master;
  const score = Math.max(54, Math.min(92, 68 + (directSupport ? 12 : 0) - (directChallenge ? 8 : 0) + (dayMasterMatch ? 6 : 0)));
  const dailySignal = generateDailySignal(self.chart, self.input.birthTimeKnown, self.input.locale ?? "en");

  return {
    score,
    sharedFocus: directSupport ? "Natural support loop" : directChallenge ? "Needs pacing and boundaries" : "Complementary rhythm",
    summary: `${selfName} brings ${selfElement} timing needs; ${partnerName} brings ${partnerElement} timing needs. Treat this as a conversation map, not a fixed relationship verdict.`,
    supportiveSignal: directSupport
      ? `One side naturally generates the other’s useful element (${selfElement} ↔ ${partnerElement}), so shared plans work best when roles are explicit.`
      : `Both profiles can still coordinate well by naming the desired pace before discussing outcomes.`,
    frictionSignal: directChallenge
      ? `The pair has a controlling-element signal (${selfElement} ↔ ${partnerElement}); avoid turning timing differences into character judgments.`
      : `No strong controlling-element warning was detected in this Lite model.`,
    nextStep: `Use today’s personal move as the opening action: ${dailySignal.do}`,
    privacyNote: "Partner birth data is used only for this calculation response and is not persisted by Relationship Lite.",
    trace: [
      { label: `${selfName} useful element`, value: selfElement },
      { label: `${partnerName} useful element`, value: partnerElement },
      { label: `${selfName} Day Master`, value: self.profile.day_master },
      { label: `${partnerName} Day Master`, value: partner.profile.day_master },
      { label: "Model", value: "BaZi element generation/control + Day Master similarity" },
    ],
  };
}
