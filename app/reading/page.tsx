import Link from "next/link";
import Background from "../components/Background";

export const metadata = {
  title: "YiShun Fortune Reading",
  description: "Start with a free YiShun summary, then unlock the full Eastern destiny report.",
};

export default function ReadingLandingPage() {
  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 pb-24 pt-10 text-white">
        <section className="glass card mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-secondary">Complete destiny report</p>
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-black tracking-[-0.06em] text-white text-glow sm:text-5xl">
              Get a free hit first. Unlock the full YiShun report when it feels true.
            </h1>
            <p className="text-sm leading-7 text-gray-300">
              This report path copies the strongest competitor pattern: free summary, shareable personal insight, locked deep chapters, and a clear paid upgrade across personality, love, career, wealth, helpful people, and future 90 days.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Free", "3 sharp personal signals"],
              ["Locked", "Personality, love, career, wealth, helpful people and future 90 days"],
              ["Share", "A destiny card you can screenshot"],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="mt-2 text-xs leading-5 text-gray-400">{copy}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/reading/start" className="rounded-2xl bg-secondary/80 px-4 py-3 text-center text-sm font-bold text-white hover:bg-secondary">
              Start free reading
            </Link>
            <Link href="/reports" className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-bold text-gray-200 hover:bg-white/5">
              Preview report library
            </Link>
          </div>

          <p className="text-xs leading-5 text-gray-500">
            Safety boundary: YiShun provides reflective guidance and timing prompts. It does not provide medical, legal, financial, investment, or deterministic claims.
          </p>
        </section>
      </main>
    </>
  );
}
