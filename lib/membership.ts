export type MembershipTier = "free" | "monthly" | "annual";

export type MembershipRules = {
  monthlyCredits: number;
  rolloverCap: number;
};

const MEMBERSHIP_RULES: Record<MembershipTier, MembershipRules> = {
  free: { monthlyCredits: 0, rolloverCap: 0 },
  monthly: { monthlyCredits: 5, rolloverCap: 10 },
  annual: { monthlyCredits: 15, rolloverCap: 30 },
};

export function normalizeMembershipTier(
  planTier: string | null | undefined
): MembershipTier {
  const normalized = (planTier ?? "").toLowerCase().trim();
  if (normalized === "monthly" || normalized === "monthly member") {
    return "monthly";
  }
  if (normalized === "annual" || normalized === "annual member") {
    return "annual";
  }
  return "free";
}

export function getMembershipRules(tier: MembershipTier): MembershipRules {
  return MEMBERSHIP_RULES[tier];
}

function monthIndex(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function monthsElapsed(from: Date, to: Date): number {
  let diff = monthIndex(to) - monthIndex(from);
  if (diff <= 0) {
    return 0;
  }
  if (to.getUTCDate() < from.getUTCDate()) {
    diff -= 1;
  }
  return Math.max(diff, 0);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function calculateAccruedCredits(params: {
  tier: MembershipTier;
  currentCredits: number;
  lastAccruedAt: Date | null;
  now?: Date;
}): { credits: number; lastAccruedAt: Date | null; monthsApplied: number } {
  const { tier, currentCredits, lastAccruedAt } = params;
  const now = params.now ?? new Date();

  if (tier === "free") {
    return { credits: currentCredits, lastAccruedAt, monthsApplied: 0 };
  }

  const rules = getMembershipRules(tier);
  if (!lastAccruedAt) {
    const cap = Math.max(rules.rolloverCap, currentCredits);
    const credits = Math.min(currentCredits + rules.monthlyCredits, cap);
    return { credits, lastAccruedAt: now, monthsApplied: 1 };
  }

  const elapsed = monthsElapsed(lastAccruedAt, now);
  if (elapsed <= 0) {
    return { credits: currentCredits, lastAccruedAt, monthsApplied: 0 };
  }

  const added = rules.monthlyCredits * elapsed;
  const cap = Math.max(rules.rolloverCap, currentCredits);
  const credits = Math.min(currentCredits + added, cap);
  const nextAccruedAt = addMonths(lastAccruedAt, elapsed);

  return { credits, lastAccruedAt: nextAccruedAt, monthsApplied: elapsed };
}

export function getAccruedCreditsUpdate(params: {
  tier: MembershipTier;
  currentCredits: number;
  lastAccruedAt: Date | null;
  now?: Date;
}): {
  credits: number;
  lastAccruedAt: Date | null;
  monthsApplied: number;
  changed: boolean;
} {
  const result = calculateAccruedCredits(params);
  const currentTimestamp = params.lastAccruedAt?.getTime() ?? null;
  const nextTimestamp = result.lastAccruedAt?.getTime() ?? null;
  const changed =
    result.credits !== params.currentCredits || currentTimestamp !== nextTimestamp;

  return { ...result, changed };
}
