import Link from "next/link";
import Background from "../../components/Background";

type PageProps = {
  searchParams: Promise<{ product?: string; session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { product, session_id: sessionId } = await searchParams;

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen grid place-items-center px-4 py-12">
        <section className="glass card max-w-lg p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-secondary/20 text-3xl">
            ✓
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-secondary/80">Stripe Test Checkout</p>
          <h1 className="mt-3 text-2xl font-heading font-bold text-white">Payment test completed</h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            This success page confirms the test checkout redirect path is wired. Fulfillment should be finalized after webhook verification before production use.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-xs text-gray-400">
            <p>Product: <span className="text-gray-200">{product || "unknown"}</span></p>
            <p className="mt-1">Session received: <span className="text-gray-200">{sessionId ? "yes" : "no"}</span></p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/reading/start" className="rounded-2xl bg-secondary/80 px-4 py-3 text-sm font-semibold text-white hover:bg-secondary">
              Start another reading
            </Link>
            <Link href="/membership" className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/5">
              View membership
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
