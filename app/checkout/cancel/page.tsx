import Link from "next/link";
import Background from "../../components/Background";

type PageProps = {
  searchParams: Promise<{ product?: string }>;
};

export default async function CheckoutCancelPage({ searchParams }: PageProps) {
  const { product } = await searchParams;

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen grid place-items-center px-4 py-12">
        <section className="glass card max-w-lg p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-3xl">
            ↩
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent/80">Checkout</p>
          <h1 className="mt-3 text-2xl font-heading font-bold text-white">Checkout canceled</h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            No payment was completed. You can return to YiShun and try again when ready.
          </p>
          {product && <p className="mt-4 text-xs text-gray-500">Canceled product: {product}</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/reading/result" className="rounded-2xl bg-secondary/80 px-4 py-3 text-sm font-semibold text-white hover:bg-secondary">
              Back to result
            </Link>
            <Link href="/membership" className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/5">
              Membership
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
