import Link from "next/link";
import { notFound } from "next/navigation";
import Background from "@/app/components/Background";
import Navigation from "@/app/components/Navigation";
import AppBackLink from "@/app/components/AppBackLink";
import { getSampleReport, SAMPLE_REPORTS } from "@/lib/sample-reports";

export function generateStaticParams() {
  return SAMPLE_REPORTS.map((sample) => ({ sampleId: sample.id }));
}

type PageProps = { params: Promise<{ sampleId: string }>; searchParams?: Promise<{ lang?: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { sampleId } = await params;
  const sample = getSampleReport(sampleId);
  return {
    title: sample ? `${sample.title} | YiShun Sample` : "YiShun Sample",
    description: sample?.summary ?? "YiShun sample timing report.",
  };
}

export default async function SampleReportPage({ params, searchParams }: PageProps) {
  const { sampleId } = await params;
  const { lang } = (await searchParams) ?? {};
  const sample = getSampleReport(sampleId);
  if (!sample) notFound();
  const isZh = sample.locale === "zh-CN";

  if (lang === "en" && isZh) {
    return (
      <>
        <Background />
        <main className="ys-shell relative z-10 min-h-screen pb-24 text-white">
          <section className="mx-auto max-w-3xl px-4 py-8">
            <header className="flex items-center justify-between gap-4">
              <AppBackLink href="/samples?lang=en" label="Samples" context="Back" />
              <span className="rounded-full border border-[#e0bd72]/30 bg-[#e0bd72]/10 px-3 py-1 text-xs text-[#e0bd72]">English mode</span>
            </header>
            <div className="ys-panel mt-8 rounded-[2rem] p-6 md:p-8">
              <p className="ys-kicker">Localized sample unavailable</p>
              <h1 className="mt-3 text-4xl font-heading font-black tracking-[-0.05em] text-white">This sample is available only in the Chinese gallery.</h1>
              <p className="mt-4 text-sm leading-7 text-gray-300">English mode does not render Chinese report text. Open an English sample instead to review the full timing structure, trust explanation, premium value, and retention path.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/samples/en-career-pivot?lang=en" className="ys-cta px-5 py-3 text-sm">Open career sample</Link>
                <Link href="/samples/en-money-boundary?lang=en" className="ys-secondary-cta px-5 py-3 text-sm">Open money sample</Link>
              </div>
            </div>
          </section>
          <Navigation />
        </main>
      </>
    );
  }

  return (
    <>
      <Background />
      <main className="ys-shell relative z-10 min-h-screen pb-24 text-white">
        <article className="mx-auto max-w-4xl px-4 py-8">
          <header className="flex items-center justify-between gap-4">
            <AppBackLink href={lang === "en" ? "/samples?lang=en" : "/samples"} label={isZh ? "样例列表" : "Samples"} context={isZh ? "返回" : "Back"} />
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">Public preview</span>
          </header>

          <section className="ys-share-card mt-8 overflow-hidden rounded-[2.25rem] p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <p className="ys-kicker">{sample.persona}</p>
                <h1 className="mt-4 font-heading text-4xl font-black leading-tight tracking-[-0.06em] text-white md:text-6xl">{sample.title}</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-200">{sample.summary}</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 text-center">
                <p className="text-6xl font-heading font-black text-white">{sample.score}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#e0bd72]">{isZh ? "清晰度" : "clarity"}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="ys-panel-soft rounded-2xl p-4"><p className="text-xs text-gray-500">{isZh ? "焦点" : "Focus"}</p><p className="mt-1 font-semibold">{sample.focus}</p></div>
              <div className="ys-panel-soft rounded-2xl p-4"><p className="text-xs text-gray-500">{isZh ? "最佳时段" : "Best window"}</p><p className="mt-1 font-semibold">{sample.bestWindow}</p></div>
              <div className="ys-panel-soft rounded-2xl p-4"><p className="text-xs text-gray-500">{isZh ? "五行提示" : "Element cue"}</p><p className="mt-1 font-semibold">{sample.elementHint}</p></div>
            </div>
          </section>

          <section className="ys-panel mt-5 rounded-3xl p-5">
            <p className="ys-kicker">{isZh ? "结果可信度" : "Why this result"}</p>
            <h2 className="mt-2 text-2xl font-heading font-bold text-white">{isZh ? "先给依据，再给建议。" : "Transparent timing before the recommendation."}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="ys-panel-soft rounded-2xl p-4"><p className="text-xs font-bold text-[#e0bd72]">{isZh ? "为什么是这个时段" : "Why this time"}</p><p className="mt-2 text-sm leading-6 text-gray-200">{sample.whyThisTime}</p></div>
              <div className="ys-panel-soft rounded-2xl p-4"><p className="text-xs font-bold text-[#e0bd72]">{isZh ? "规则引擎 vs Gemini" : "Rules engine vs Gemini"}</p><p className="mt-2 text-sm leading-6 text-gray-200">{sample.whyThisResult}</p></div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
            <div className="ys-panel rounded-3xl p-5">
              <p className="ys-kicker">{isZh ? "行动建议" : "Action plan"}</p>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-100">
                {sample.actions.map((action) => <li key={action}>{action}</li>)}
              </ol>
            </div>
            <div className="space-y-5">
              <div className="ys-panel rounded-3xl p-5">
                <p className="ys-kicker">{isZh ? "适合 / 避免" : "Best for / avoid"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sample.bestFor.map((item) => <span key={item} className="rounded-full bg-[#6f9a84]/15 px-3 py-1 text-xs text-[#a8d8bd]">{item}</span>)}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-300"><span className="text-[#e0bd72]">{isZh ? "避免：" : "Avoid: "}</span>{sample.avoid}</p>
              </div>
              <div className="ys-panel-soft rounded-3xl p-5 text-xs leading-5 text-gray-400">{sample.disclaimer}</div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="ys-panel rounded-3xl p-5">
              <p className="ys-kicker">{isZh ? "付费价值" : "Premium value"}</p>
              <h2 className="mt-2 text-xl font-heading font-bold text-white">{isZh ? "从信号升级为可保存计划。" : "Upgrade from signal to keepable plan."}</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-200">
                {sample.premiumValue.map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
            </div>
            <div className="ys-panel rounded-3xl p-5">
              <p className="ys-kicker">{isZh ? "留存路径" : "Retention path"}</p>
              <h2 className="mt-2 text-xl font-heading font-bold text-white">{isZh ? "让用户明天有理由回来。" : "Give users a reason to return tomorrow."}</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-200">
                {sample.retentionPath.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </section>

          <section className="ys-panel mt-5 rounded-3xl p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="ys-kicker">{isZh ? "下一步" : "Next step"}</p>
              <h2 className="mt-2 text-xl font-heading font-bold">{isZh ? "生成你自己的每日时机卡" : "Generate your own daily timing card"}</h2>
              <p className="mt-2 text-sm text-gray-400">{isZh ? "不会公开出生资料，分享卡只展示行动摘要。" : "Birth details stay private; share cards only show the action summary."}</p>
            </div>
            <Link href="/reading/start?ref=sample" className="ys-cta mt-4 px-5 py-3 text-sm sm:mt-0">{isZh ? "开始生成" : "Start now"}</Link>
          </section>
        </article>
        <Navigation />
      </main>
    </>
  );
}
