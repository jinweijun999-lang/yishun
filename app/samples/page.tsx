import Link from "next/link";
import Background from "@/app/components/Background";
import Navigation from "@/app/components/Navigation";
import AppBackLink from "@/app/components/AppBackLink";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";

export const metadata = {
  title: "YiShun Sample Reports",
  description: "Browse Chinese and English YiShun sample timing reports without personal data.",
};

type PageProps = { searchParams?: Promise<{ lang?: string }> };

export default async function SamplesPage({ searchParams }: PageProps) {
  const { lang } = (await searchParams) ?? {};
  const isEnglish = lang === "en";
  const groups = [
    { label: "English samples", note: "Public-card quality for overseas acquisition", items: SAMPLE_REPORTS.filter((sample) => sample.locale === "en") },
    ...(isEnglish ? [] : [{ label: "中文样例", note: "适合出海产品里的中文用户验证", items: SAMPLE_REPORTS.filter((sample) => sample.locale === "zh-CN") }]),
  ];

  return (
    <>
      <Background />
      <main className="ys-shell relative z-10 min-h-screen pb-24 text-white">
        <section className="mx-auto max-w-6xl px-4 py-8">
          <header className="flex items-center justify-between gap-4">
            <AppBackLink href="/" label="YiShun" context="Back" />
            <span className="rounded-full border border-[#e0bd72]/30 bg-[#e0bd72]/10 px-3 py-1 text-xs text-[#e0bd72]">Sample gallery</span>
          </header>

          <div className="ys-panel mt-8 overflow-hidden rounded-[2.25rem] p-6 md:p-8">
            <p className="ys-kicker">No personal data required</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <h1 className="font-heading text-4xl font-black tracking-[-0.06em] text-white md:text-6xl">Sample reports are product proof, not test pages.</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300">
                  Before asking for birth data, YiShun shows the exact value shape: rhythm, insight, action, boundary, and a clean CTA.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Today rhythm", "Key insight", "Share-card CTA"].map((item) => (
                  <div key={item} className="ys-panel-soft rounded-3xl p-4">
                    <p className="text-xs font-black text-[#e0bd72]">{item}</p>
                    <p className="mt-3 text-xs leading-5 text-gray-400">Same report structure, adapted by user intent.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {groups.map((group) => (
            <section key={group.label} className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">{group.label}</h2>
                  <p className="mt-1 text-xs text-gray-500">{group.note}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {group.items.map((sample) => (
                  <Link key={sample.id} href={`/samples/${sample.id}${isEnglish ? "?lang=en" : ""}`} className="ys-share-card group rounded-[2rem] p-5 transition hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#e0bd72]">{sample.persona}</p>
                        <h3 className="mt-3 text-2xl font-heading font-black tracking-[-0.04em] text-white">{sample.title}</h3>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                        <p className="text-2xl font-bold text-white">{sample.score}</p>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">score</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-300">{sample.summary}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {sample.bestFor.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-[#6f9a84]/15 px-3 py-1 text-xs text-[#a8d8bd]">{item}</span>)}
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-gray-400">
                      <span>{sample.focus} · {sample.bestWindow}</span>
                      <span className="font-bold text-[#e0bd72] transition group-hover:translate-x-1">Open report →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section className="ys-panel mt-8 rounded-3xl p-5">
            <p className="ys-kicker">Why upgrade</p>
            <h2 className="mt-2 text-2xl font-heading font-bold text-white">Premium turns a sample signal into a plan users can keep.</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                "Deep report with PDF/share-image export",
                "Transparent rules-engine evidence and Gemini boundary",
                "Tomorrow reminder, important-date reminder, and streak incentive",
              ].map((item) => <div key={item} className="ys-panel-soft rounded-2xl p-4 text-sm leading-6 text-gray-200">{item}</div>)}
            </div>
          </section>
        </section>
        <Navigation />
      </main>
    </>
  );
}
