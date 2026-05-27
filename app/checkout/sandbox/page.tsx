import Link from "next/link";
import Background from "../../components/Background";

const productLabels: Record<string, string> = {
  consultation_single: "1 question credit",
  report_single: "Full Report unlock",
  premium_monthly: "Monthly membership",
  premium_annual: "Annual membership",
};

type PageProps = {
  searchParams: Promise<{ product?: string; mock_checkout_session?: string }>;
};

export default async function CheckoutSandboxPage({ searchParams }: PageProps) {
  const { product = "unknown", mock_checkout_session: mockSession } = await searchParams;
  const label = productLabels[product] ?? product;

  return (
    <>
      <Background />
      <main className="relative z-10 grid min-h-screen place-items-center px-4 py-12">
        <section className="glass card max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 text-3xl">⌛</div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">Checkout unavailable</p>
          <h1 className="mt-3 text-2xl font-heading font-bold text-white">Payment is not available right now</h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            YiShun could not open a verified checkout session. Your card was not charged, and paid access has not been granted.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-left text-xs leading-5 text-gray-400">
            <p>Requested product: <span className="text-gray-100">{label}</span></p>
            <p>Checkout request: <span className="text-gray-100">{mockSession ? "received" : "not confirmed"}</span></p>
            <p>Fulfillment: <span className="text-amber-200">not confirmed</span></p>
            <p>Safety: <span className="text-green-200">no card charge · no credit change · no paid unlock</span></p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/membership" className="rounded-2xl bg-secondary/80 px-4 py-3 text-sm font-semibold text-white hover:bg-secondary">Back to membership</Link>
            <Link href="/profile" className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/5">View profile</Link>
          </div>
        </section>
      </main>
    </>
  );
}
