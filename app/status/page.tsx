import Link from "next/link";
import { getYiShunHealthSnapshot, type YiShunCheckStatus } from "@/lib/yishun-health";

export const dynamic = "force-dynamic";

const labelForStatus: Record<YiShunCheckStatus, string> = {
  ok: "Healthy",
  configured: "Configured",
  not_configured: "Not configured",
  missing: "Missing",
  error: "Needs attention",
};

const toneForStatus: Record<YiShunCheckStatus, string> = {
  ok: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  configured: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  not_configured: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  missing: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  error: "border-rose-300/30 bg-rose-300/10 text-rose-100",
};

function CheckRow({ label, status, detail }: { label: string; status: YiShunCheckStatus; detail: string }) {
  return (
    <div className="grid gap-3 border-t border-white/10 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <h2 className="text-base font-semibold text-white">{label}</h2>
        <p className="mt-1 text-sm leading-6 text-stone-300">{detail}</p>
      </div>
      <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${toneForStatus[status]}`}>
        {labelForStatus[status]}
      </span>
    </div>
  );
}

export default async function StatusPage() {
  const health = await getYiShunHealthSnapshot();
  const checkedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(health.time));

  return (
    <main className="min-h-screen bg-[#0b0d0b] px-4 py-10 text-stone-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-[#d8bd7a] hover:text-white">
          YiShun
        </Link>
        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${health.ok ? toneForStatus.ok : toneForStatus.error}`}>
              {health.ok ? "Operational" : "Degraded"}
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-stone-500">Public Status</span>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-normal text-white sm:text-5xl">YiShun Status</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">
            Live readiness snapshot for YiShun production surfaces. This page exposes safe operational state only:
            no secrets, database URLs, user data, payment details, or private analytics rows.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Service</p>
              <p className="mt-2 text-sm font-semibold text-white">{health.service}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Release</p>
              <p className="mt-2 break-all text-sm font-semibold text-white">{health.version}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Checked</p>
              <p className="mt-2 text-sm font-semibold text-white">{checkedAt} UTC</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] px-5">
          <CheckRow label="Application" status={health.checks.app} detail="Next.js route handling and status rendering are responding." />
          <CheckRow label="Database" status={health.checks.database} detail="Entitlements, saved reports, accounts, and support records depend on this check." />
          <CheckRow label="Stripe" status={health.checks.stripe} detail="Payment readiness checks whether checkout, visible paid prices, and webhook fulfillment settings are present." />
          <CheckRow label="Google OAuth" status={health.checks.googleOAuth} detail={`Authorized redirect must match ${health.integrations.googleOAuth.expectedRedirectUri}.`} />
          <CheckRow label="Analytics" status={health.checks.analytics} detail="Funnel and operations reporting depends on a configured analytics endpoint or server log sink." />
        </section>
      </div>
    </main>
  );
}
