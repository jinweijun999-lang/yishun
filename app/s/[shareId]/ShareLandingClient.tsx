"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { queueP0Analytics } from "@/lib/p0-analytics";
import { useI18n } from "../../components/LocaleProvider";
import type { PublicSharePayload } from "@/lib/share-links";

type ShareLandingClientProps = {
  shareId: string;
  payload: PublicSharePayload | null;
  status: "ready" | "missing" | "expired";
  createdAt?: string;
};

function deviceType() {
  if (typeof window === "undefined") return "unknown";
  return window.matchMedia("(max-width: 640px)").matches ? "mobile" : "desktop";
}

const zhShareValueMap: Record<string, string> = {
  Daily: "每日",
  General: "综合",
  Work: "事业",
  Money: "财务",
  Love: "情感",
  Energy: "能量",
  Creativity: "创意",
  Wood: "木",
  Fire: "火",
  Earth: "土",
  Metal: "金",
  Water: "水",
  "Center / Northeast": "中宫 / 东北",
};

const zhShareActionMap: Record<string, string> = {
  "Borrow Wood energy: write the next step before making a commitment.": "借用木的能量：先写下下一步，再做承诺。",
  "Borrow Fire energy: share one clear message instead of over-explaining.": "借用火的能量：清楚表达一个重点，不要过度解释。",
  "Borrow Earth energy: choose the stable option and confirm the details.": "借用土的能量：选择更稳定的方案，并确认关键细节。",
  "Borrow Metal energy: cut one unnecessary task before starting something new.": "借用金的能量：开始新事前，先砍掉一个不必要任务。",
  "Borrow Water energy: pause for ten minutes before replying to important messages.": "借用水的能量：回复重要消息前，先暂停十分钟。",
  "forcing a final answer before the options have room to grow": "选项还没充分展开前，不要强迫自己立刻定案。",
  "reacting quickly just to keep the energy high": "不要为了维持热度而仓促反应。",
  "saying yes to vague plans without confirming the ground rules": "规则没确认前，不要答应模糊计划。",
  "cutting off a useful option because it is not perfect yet": "不要因为还不完美就砍掉有用选项。",
  "over-reading signals without choosing one small next step": "不要过度解读信号，却不选择一个小行动。",
};

function localizeShareText(value: string | undefined, isZh: boolean) {
  if (!value) return "";
  if (!isZh) return value;
  const mapped = zhShareValueMap[value] ?? zhShareActionMap[value];
  if (mapped) return mapped;
  return value
    .replace(/clarity/gi, "清晰度")
    .replace(/Daily Timing Card/g, "每日时机卡")
    .replace(/Today’s/g, "今日");
}

export default function ShareLandingClient({ shareId, payload, status, createdAt }: ShareLandingClientProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh-CN";
  const target = `/reading/start?ref=share&share_id=${encodeURIComponent(shareId)}`;
  const enteredAtRef = useRef<number>(0);
  const maxScrollDepthRef = useRef<number>(0);
  const ctaClickedRef = useRef(false);
  const exitTrackedRef = useRef(false);

  useEffect(() => {
    queueP0Analytics("share_landing_view", {
      share_id: shareId,
      referrer: document.referrer || "direct",
      utm_source: new URLSearchParams(window.location.search).get("utm_source") ?? "share_link",
      device_type: deviceType(),
      status,
    });
  }, [shareId, status]);

  useEffect(() => {
    enteredAtRef.current = Date.now();

    function updateScrollDepth() {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = scrollableHeight <= 0 ? 100 : Math.round((window.scrollY / scrollableHeight) * 100);
      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, Math.min(100, Math.max(0, scrollDepth)));
    }

    function trackExit() {
      if (ctaClickedRef.current || exitTrackedRef.current) return;
      exitTrackedRef.current = true;
      updateScrollDepth();
      queueP0Analytics("share_landing_exit", {
        share_id: shareId,
        dwell_ms: Math.max(0, Date.now() - (enteredAtRef.current || Date.now())),
        scroll_depth: maxScrollDepthRef.current,
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") trackExit();
    }

    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", trackExit);

    return () => {
      window.removeEventListener("scroll", updateScrollDepth);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", trackExit);
    };
  }, [shareId]);

  async function handleCtaClick(ctaType: "generate_my_card" | "open_app") {
    ctaClickedRef.current = true;
    const properties = { share_id: shareId, cta_type: ctaType, device_type: deviceType(), locale: navigator.language || "en" };
    queueP0Analytics("share_landing_cta_click", properties);
    queueP0Analytics("shared_user_generate_started", { share_id: shareId, entry_screen: "share_landing", locale: properties.locale });
    await fetch(`/api/v1/shares/${encodeURIComponent(shareId)}/cta`, { method: "POST" }).catch(() => undefined);
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5 text-white sm:max-w-2xl sm:py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-heading text-lg font-bold tracking-wide text-white">YiShun</Link>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-accent">{isZh ? "已分享的洞察" : "Shared insight"}</span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-5 py-8">
        <div className="rounded-[2rem] border border-secondary/25 bg-gradient-to-br from-secondary/20 via-surface/85 to-accent/15 p-5 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.26em] text-secondary">{isZh ? "朋友分享了一条易顺时机洞察" : "A friend shared a YiShun insight with you"}</p>
          <h1 className="mt-4 text-3xl font-heading font-bold leading-tight text-glow sm:text-4xl">
            {payload?.title ?? (status === "expired" ? (isZh ? "这张易顺卡片已过期" : "This YiShun card has expired") : (isZh ? "生成你自己的时机卡" : "Create your own timing card"))}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            {payload?.summary ?? (isZh ? "这张分享快照暂时不可用，但你仍可在约 60 秒内生成自己的每日时机卡。" : "The shared snapshot is not available now, but you can still generate your own daily timing card in about 60 seconds.")}
          </p>
          {createdAt && <p className="mt-3 text-xs text-gray-500">{isZh ? "分享于" : "Shared"} {new Date(createdAt).toLocaleDateString(isZh ? "zh-CN" : undefined, { month: "short", day: "numeric" })}</p>}
        </div>

        <article className="rounded-[2rem] border border-white/15 bg-black/30 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur" aria-label={isZh ? "公开分享预览卡" : "Public share preview card"}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">{isZh ? "易顺时机卡" : "YiShun Timing Card"}</p>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{localizeShareText(payload?.theme ?? "Daily", isZh)}</span>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-gray-200">
            {payload?.score_label && <p><span className="text-secondary">{isZh ? "清晰度：" : "Clarity:"}</span> {localizeShareText(payload.score_label, isZh)}</p>}
            {payload?.best_window && <p><span className="text-secondary">{isZh ? "最佳：" : "Best:"}</span> {payload.best_window}</p>}
            {payload?.avoid_window && <p><span className="text-accent">{isZh ? "避免：" : "Avoid:"}</span> {localizeShareText(payload.avoid_window, isZh)}</p>}
            {payload?.action && <p><span className="text-white">{isZh ? "尝试：" : "Try:"}</span> {localizeShareText(payload.action, isZh)}</p>}
            {payload?.element_hint && <p><span className="text-gray-400">{isZh ? "五行提示：" : "Element cue:"}</span> {localizeShareText(payload.element_hint, isZh)}</p>}
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-gray-400">
            {isZh ? "这里不会展示出生日期、出生地、真实姓名、邮箱或私人命盘细节。" : "No birth date, birth place, real name, email, or private chart details are shown here."}
          </p>
        </article>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-gray-300">
          {isZh ? "用于自我反思和觉察，不做确定性预测。易顺只提供一个实用时机提示，不保证结果。" : "For reflection and self-awareness, not deterministic prediction. YiShun gives one practical timing prompt — never guaranteed outcomes."}
        </div>

        <div className="grid gap-3">
          <Link
            href={target}
            onClick={() => void handleCtaClick("generate_my_card")}
            className="rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-center text-sm font-bold text-white shadow-2xl shadow-black/40"
          >
            {isZh ? "生成我的易顺卡" : "Generate my Yi Card"}
          </Link>
          <a
            href={`yishun://share/${encodeURIComponent(shareId)}`}
            onClick={() => void handleCtaClick("open_app")}
            className="rounded-2xl border border-white/20 px-5 py-4 text-center text-sm font-semibold text-gray-200 hover:bg-white/5"
          >
            {isZh ? "在 App 中打开" : "Open in app"}
          </a>
        </div>
      </main>

      <footer className="flex justify-center gap-4 pb-4 text-xs text-gray-500">
        <Link href="/privacy" className="hover:text-gray-300">{isZh ? "隐私" : "Privacy"}</Link>
        <Link href="/terms" className="hover:text-gray-300">{isZh ? "条款" : "Terms"}</Link>
      </footer>
    </section>
  );
}
