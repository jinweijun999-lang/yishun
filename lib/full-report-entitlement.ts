import { prisma } from "@/lib/prisma";
import { normalizeMembershipTier } from "@/lib/membership";

export type FullReportEntitlementStatus = "locked" | "unlocked" | "pending";

export type FullReportEntitlement = {
  status: FullReportEntitlementStatus;
  source: "none" | "report_single_adapter" | "membership";
  reportScope: "current_profile";
  note: string;
  lastUpdatedAt?: string;
};

export const FULL_REPORT_ADAPTER_NOTE =
  "P0-B safe adapter: report_single grants Full Report access via StripeWebhookEvent history until a dedicated ReportEntitlement table is migrated.";

export function getMembershipFullReportEntitlement(planTier: string | null | undefined): FullReportEntitlement | null {
  const tier = normalizeMembershipTier(planTier ?? "free");
  if (tier === "monthly" || tier === "annual") {
    return {
      status: "unlocked",
      source: "membership",
      reportScope: "current_profile",
      note: "Membership includes full-report access; ask credits are still consumed only for AI questions.",
    };
  }
  return null;
}

export async function getFullReportEntitlementForUser(userId: string, planTier?: string | null): Promise<FullReportEntitlement> {
  const membership = getMembershipFullReportEntitlement(planTier);
  if (membership) return membership;

  const reportEvent = await prisma.stripeWebhookEvent.findFirst({
    where: { userId, product: "report_single", status: "fulfilled" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (reportEvent) {
    return {
      status: "unlocked",
      source: "report_single_adapter",
      reportScope: "current_profile",
      note: FULL_REPORT_ADAPTER_NOTE,
      lastUpdatedAt: reportEvent.createdAt.toISOString(),
    };
  }

  return {
    status: "locked",
    source: "none",
    reportScope: "current_profile",
    note: "Full Report is separate from ask credits. Ask credits do not unlock the full report.",
  };
}
