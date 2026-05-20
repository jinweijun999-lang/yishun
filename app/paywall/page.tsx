import Link from "next/link";
import Background from "../components/Background";

export default function PaywallPage() {
  return (
    <>
      <Background />
      <main className="ys-shell relative z-10 min-h-screen px-4 py-8 text-[#f5efe1]">
        <section className="mx-auto max-w-5xl rounded-[2.25rem] border border-[#e0bd72]/20 bg-[#0b0f0d]/85 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-9">
          <Link href="/" className="text-xs font-black uppercase tracking-[0.22em] text-[#c2a067] hover:text-[#f1d28e]">← Back to YiShun</Link>
          <p className="mt-8 text-[11px] font-black uppercase tracking-[0.28em] text-[#7aa48c]">Paywall · 深度解锁</p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-black leading-[0.98] tracking-[-0.06em] text-white md:text-6xl">Free gives the hit. Paid unlocks the depth.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#d8d0bf]">The free preview gives a useful hit. Paid unlocks the part users can save, revisit, and act on: deeper report modules, AI Master reasoning, relationship timing, and ritual follow-up.</p>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {[
              ["Free preview", "$0", "One ritual/profile/compatibility/ask preview, share CTA, and a clear next action.", "/reading/start?source=paywall_free"],
              ["AI Master", "$2.99", "One complete answer with 3 reasons, risk boundary, and 7/30-day action plan.", "/membership?source=paywall_ai_master&intent=ask_credit"],
              ["Full Report", "$4.99", "Personality, love, career, wealth, helpful people, key dates, and a saveable checklist.", "/reading/result?source=paywall_full_report&intent=full_report"],
              ["Membership", "$9.99/mo", "Ongoing daily signals, monthly question credits, history retention, and restore access.", "/membership?source=paywall_membership"],
            ].map(([title, price, body, href]) => (
              <Link key={title} href={href} className="group rounded-3xl border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-0.5 hover:border-[#e0bd72]/45 hover:bg-[#e0bd72]/10">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#c2a067]">{title}</p>
                <h2 className="mt-3 text-2xl font-black text-white">{price}</h2>
                <p className="mt-3 text-sm leading-6 text-[#aaa292]">{body}</p>
                <span className="mt-4 inline-flex text-xs font-black text-[#e0bd72] transition group-hover:translate-x-1">Choose →</span>
              </Link>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/membership?source=paywall" className="rounded-2xl bg-[#e0bd72] px-5 py-3 text-sm font-black text-[#10130f] hover:bg-[#f1d28e]">Compare all paid options</Link>
            <Link href="/reading/start?source=paywall" className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-[#e8e1d2] hover:bg-white/5">Start Full Report preview</Link>
            <Link href="/ask-master?source=paywall" className="rounded-2xl border border-[#7aa48c]/30 px-5 py-3 text-sm font-black text-[#a8d8bd] hover:bg-[#7aa48c]/10">Ask AI Master first</Link>
          </div>
        </section>
      </main>
    </>
  );
}
