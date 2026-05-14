import Link from "next/link";
import { notFound } from "next/navigation";
import Background from "@/app/components/Background";
import Navigation from "@/app/components/Navigation";
import { getSampleReport, SAMPLE_REPORTS } from "@/lib/sample-reports";

export function generateStaticParams() {
  return SAMPLE_REPORTS.map((sample) => ({ sampleId: sample.id }));
}

type PageProps = { params: Promise<{ sampleId: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { sampleId } = await params;
  const sample = getSampleReport(sampleId);
  return {
    title: sample ? `${sample.title} | YiShun Sample` : "YiShun Sample",
    description: sample?.summary ?? "YiShun sample timing report.",
  };
}

export default async function SampleReportPage({ params }: PageProps) {
  const { sampleId } = await params;
  const sample = getSampleReport(sampleId);
  if (!sample) notFound();
  const isZh = sample.locale === "zh-CN";

  return (
    <>
      <Background />
      <main className="ys-shell relative z-10 min-h-screen pb-24 text-white">
        <article className="mx-auto max-w-4xl px-4 py-8">
          <header className="flex items-center justify-between gap-4">
            <Link href="/samples" className="text-sm text-gray-300 hover:text-white">← {isZh ? "样例列表" : "Samples"}</Link>
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
