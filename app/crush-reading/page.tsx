import Link from "next/link";
import Background from "../components/Background";
import PaymentValueMatrix from "../components/PaymentValueMatrix";

export default function CrushReadingPage() {
  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 py-10">
        <section className="mx-auto max-w-3xl space-y-5">
          <div className="glass card p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-pink-200">Love Compatibility · Crush Reading</p>
            <h1 className="mt-3 text-4xl font-heading font-bold text-white text-glow">Get a 3-minute love signal before you overthink the next message.</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">Start with Relationship Lite for two birth profiles, then ask AI Love for one focused follow-up. Free summary first; deep report checkout stays separate and pending until payment succeeds.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Link href="/relationship-lite?source=crush_reading" className="rounded-2xl bg-gradient-to-r from-pink-500 to-secondary px-4 py-3 text-center text-sm font-black text-white">Start compatibility</Link>
              <Link href="/ai-question?source=crush_reading&domain=love" className="rounded-2xl border border-pink-300/30 bg-pink-300/10 px-4 py-3 text-center text-sm font-bold text-pink-100">Ask AI Love</Link>
              <Link href="/reading/start?source=crush_reading" className="rounded-2xl border border-[#e0bd72]/30 bg-[#e0bd72]/10 px-4 py-3 text-center text-sm font-bold text-[#e0bd72]">Unlock $0.99-style report</Link>
            </div>
          </div>
          <PaymentValueMatrix compact source="crush_reading" />
        </section>
      </main>
    </>
  );
}
