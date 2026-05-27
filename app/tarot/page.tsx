import Link from "next/link";
import Background from "../components/Background";
import PaymentValueMatrix from "../components/PaymentValueMatrix";

const paths = [
  ["🃏", "Tarot quick pull", "Pick one theme, then ask AI for a grounded reflection.", "tarot"],
  ["🎋", "灵签", "A lightweight oracle-stick style prompt for love, money, or career.", "oracle_stick"],
  ["🪙", "铜钱卦", "Coin-style divination entry reserved for the next rules adapter.", "coin_divination"],
];

export default function TarotHubPage() {
  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 py-10">
        <section className="mx-auto max-w-4xl space-y-5">
          <div className="glass card p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-200">Tarot / 灵签 / 铜钱卦</p>
            <h1 className="mt-3 text-4xl font-heading font-bold text-white text-glow">A fast divination hub that leads into paid Ask AI or a deep report.</h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">Choose a quick symbolic prompt, then continue into a focused AI reflection or a deeper birth-chart report when you are ready.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {paths.map(([icon, title, body, mode]) => (
              <Link key={mode} href={`/ai-question?source=tarot_hub&mode=${mode}`} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5 hover:border-violet-300/40 hover:bg-violet-300/10">
                <p className="text-3xl">{icon}</p>
                <h2 className="mt-3 text-xl font-heading font-bold text-white">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-gray-400">{body}</p>
                <p className="mt-4 text-xs font-bold text-violet-200">Ask AI with confirmation →</p>
              </Link>
            ))}
          </div>
          <PaymentValueMatrix compact source="tarot_hub" />
        </section>
      </main>
    </>
  );
}
