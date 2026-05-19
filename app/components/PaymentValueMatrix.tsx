import Link from "next/link";

type PaymentValueMatrixProps = {
  isEnglish?: boolean;
  credits?: number | null;
  compact?: boolean;
  source?: string;
};

const copy = {
  en: {
    eyebrow: "What each option unlocks",
    title: "Free, credit, full report, and membership are different products.",
    subtitle: "Free gives today’s short signal. A credit is for one focused AI question. A full report expands the timing plan. Membership is for ongoing access.",
    currentCredits: "Current credits",
    buyCredit: "Buy one Ask Credit",
    askWithCredit: "Use 1 credit",
    unlockReport: "Buy Full Report",
    membership: "Compare membership",
    rows: [
      ["Free summary", "Today’s best window, avoid boundary, one practical action, local save/share."],
      ["1 question credit", "Use 1 credit for one focused AI question with precheck and explicit confirmation."],
      ["Full report", "One-time 7-day timing plan, key dates, risk notes, and saveable checklist."],
      ["Membership", "Ongoing daily signals without rewarded access plus monthly credits and history retention."],
    ],
  },
  zh: {
    eyebrow: "付费后得到什么",
    title: "免费摘要、问事次数、完整报告、会员不是同一个权益。",
    subtitle: "免费给今日短信号；1 次数用于一次聚焦问事；完整报告展开 7 天计划；会员适合持续使用。",
    currentCredits: "当前次数",
    buyCredit: "购买 1 次问事次数",
    askWithCredit: "使用 1 次问事",
    unlockReport: "购买完整报告",
    membership: "对比会员权益",
    rows: [
      ["免费摘要", "今日最佳窗口、避开边界、一项行动，可本地保存/分享。"],
      ["1 次问事", "消耗 1 次数，进行一次聚焦 AI 问事；先预检并明确确认。"],
      ["完整报告", "单次购买 7 天择时计划、关键日期、风险提示和可保存清单。"],
      ["订阅会员", "持续每日信号、月度问事次数和历史保留，适合长期复盘。"],
    ],
  },
};

export default function PaymentValueMatrix({ isEnglish = true, credits, compact = false, source = "payment_value_matrix" }: PaymentValueMatrixProps) {
  const c = isEnglish ? copy.en : copy.zh;
  const query = `?source=${encodeURIComponent(source)}`;
  const fullReportQuery = `${query}&intent=full_report`;

  return (
    <section className={`rounded-[2rem] border border-[#e0bd72]/25 bg-gradient-to-br from-[#e0bd72]/12 via-white/[0.04] to-secondary/10 ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#e0bd72]">{c.eyebrow}</p>
          <h2 className="mt-2 text-xl font-heading font-bold text-white sm:text-2xl">{c.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">{c.subtitle}</p>
        </div>
        {typeof credits === "number" ? (
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">{c.currentCredits}</p>
            <p className="mt-1 text-3xl font-black text-white">{credits}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {c.rows.map(([label, body]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-bold text-white">{label}</p>
            <p className="mt-2 text-xs leading-5 text-gray-400">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link href={`/membership${query}`} className="rounded-2xl bg-gradient-to-r from-secondary to-accent px-4 py-3 text-center text-sm font-black text-white">
          {c.buyCredit}
        </Link>
        <Link href={`/ai-question${query}`} className="rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-center text-sm font-bold text-secondary">
          {c.askWithCredit}
        </Link>
        <Link href={`/reading/result${fullReportQuery}`} className="rounded-2xl border border-[#e0bd72]/30 bg-[#e0bd72]/10 px-4 py-3 text-center text-sm font-bold text-[#e0bd72]">
          {c.unlockReport}
        </Link>
      </div>
      <div className="mt-3 text-center">
        <Link href={`/membership${query}`} className="text-xs font-semibold text-gray-400 underline-offset-4 hover:text-white hover:underline">
          {c.membership}
        </Link>
      </div>
    </section>
  );
}
