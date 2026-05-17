import Link from "next/link";
import Background from "./Background";

type BanglistResultPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
  freeResult: {
    scoreLabel: string;
    score: string;
    summary: string;
    chips: string[];
    advice: string[];
  };
  shareText: string;
  paidTitle: string;
  paidBullets: string[];
  nextHref?: string;
  nextLabel?: string;
};

export default function BanglistResultPage({
  eyebrow,
  title,
  subtitle,
  badge,
  freeResult,
  shareText,
  paidTitle,
  paidBullets,
  nextHref = "/paywall?source=result_locked",
  nextLabel = "Unlock deep reading",
}: BanglistResultPageProps) {
  const shareHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText)}`;

  return (
    <>
      <Background />
      <main className="ys-shell relative z-10 min-h-screen px-4 py-6 text-[#f5efe1]">
        <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
          <div className="rounded-[2rem] border border-[#e0bd72]/20 bg-[#0b0f0d]/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-7">
            <Link href="/" className="text-xs font-black uppercase tracking-[0.22em] text-[#c2a067] hover:text-[#f1d28e]">← YiShun</Link>
            <p className="mt-7 text-[11px] font-black uppercase tracking-[0.28em] text-[#7aa48c]">{eyebrow}</p>
            <h1 className="mt-4 max-w-2xl font-heading text-4xl font-black leading-[0.98] tracking-[-0.06em] text-white md:text-6xl">{title}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#d8d0bf]">{subtitle}</p>
            <div className="mt-6 inline-flex rounded-full border border-[#e0bd72]/25 bg-[#e0bd72]/10 px-4 py-2 text-xs font-black text-[#e0bd72]">{badge}</div>
          </div>

          <article className="ys-share-card relative overflow-hidden rounded-[2rem] p-5 md:p-7">
            <div className="absolute right-[-5rem] top-[-5rem] h-44 w-44 rounded-full border border-[#e0bd72]/20" />
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#c2a067]">Free result</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-[#a9a18f]">{freeResult.scoreLabel}</p>
                <p className="mt-1 text-5xl font-black tracking-[-0.07em] text-white">{freeResult.score}</p>
              </div>
              <span className="rounded-full border border-[#7aa48c]/25 bg-[#7aa48c]/10 px-3 py-1 text-xs font-black text-[#a8d8bd]">Free preview</span>
            </div>
            <p className="mt-5 text-lg font-bold leading-7 text-[#f5efe1]">{freeResult.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {freeResult.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-[#e8e1d2]">{chip}</span>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              {freeResult.advice.map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[#e8e1d2]">
                  <span className="mr-2 text-[#e0bd72]">0{index + 1}</span>{item}
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href={shareHref} className="rounded-2xl border border-[#7aa48c]/30 bg-[#7aa48c]/10 px-5 py-3 text-center text-sm font-black text-[#a8d8bd] hover:bg-[#7aa48c]/15">Share this result</a>
              <Link href={nextHref} className="rounded-2xl bg-[#e0bd72] px-5 py-3 text-center text-sm font-black text-[#10130f] hover:bg-[#f1d28e]">{nextLabel}</Link>
            </div>
          </article>
        </section>

        <section className="mx-auto mt-5 max-w-6xl rounded-[2rem] border border-[#e0bd72]/20 bg-[#e0bd72]/[0.07] p-5 md:p-7">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#e0bd72]">Locked deep section</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">{paidTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-[#aaa292]">Free users only see the result above. Deep timing, long-range trend, save history, and follow-up prompts stay locked until checkout or entitlement recovery.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {paidBullets.map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-[#ede6d6]">🔒 {item}</div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={nextHref} className="rounded-2xl bg-[#e0bd72] px-5 py-3 text-sm font-black text-[#10130f] hover:bg-[#f1d28e]">View paid unlock</Link>
            <Link href="/membership?source=locked_result" className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-[#e8e1d2] hover:bg-white/5">Compare membership</Link>
          </div>
        </section>
      </main>
    </>
  );
}
