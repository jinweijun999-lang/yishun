"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Background from "../../components/Background";
import FiveElementsChart from "../../components/FiveElementsChart";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import AppBackLink from "../../components/AppBackLink";
import { useI18n } from "../../components/LocaleProvider";
import StripeCheckoutButton from "../../components/StripeCheckoutButton";
import { queueP0Analytics } from "@/lib/p0-analytics";
import { YISHUN_EVENTS, trackYiShunEvent } from "@/lib/p1-analytics";

type PreviewData = {
  birthProfile: {
    birthDate: string;
    birthTime: string | null;
    birthTimeKnown: boolean;
    birthPlaceText?: string | null;
    timezoneName?: string | null;
    timezoneOffsetMinutes?: number | null;
  };
  trueSolarTime: null | {
    date: string;
    time: string;
    offsetMinutes: number;
    changedHourPillar: boolean;
    changedDayBoundary: boolean;
    precision: string;
  };
  fourPillars: Record<string, { pillar: string; stemTenGod?: string }>;
  dayMaster: string;
  elementsBalance: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  dominantElement: string;
  missingElement: string;
  favorableElement: string;
  tenGodPattern: { label: string; plain: string };
  interpretation: {
    dayMasterDescription: string;
    strengthAnalysis: string;
    favorableElements: string[];
  };
  dailySignal: {
    score: number;
    bestFor: string[];
    do: string;
    avoid: string;
    bestHour: string;
    luckyElement: string;
    luckyDirection: string;
    why: string;
    deeperInsight: string;
    disclaimer: string;
  };
  ai?:
    | {
        status: "ok";
        provider: "gemini";
        model: string;
        attribution: string;
        interpretationBasis: string;
        summary: string;
        signalsUsed: string[];
        actionSuggestions: string[];
        reflectionQuestion: string;
        terminologyNote: string;
      }
    | {
        status: "fallback";
        provider: "rules";
        reason: string;
        attribution: string;
        interpretationBasis: string;
      };
  focus?: string;
};

type DailyArchiveItem = {
  date: string;
  score: number;
  bestFor: string[];
  focus: string;
  savedAt: string;
  bestHour?: string;
  avoid?: string;
  action?: string;
};

function track(event: string, properties: Record<string, unknown> = {}) {
  queueP0Analytics(event, properties);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getAnonymousId() {
  if (typeof window === "undefined") return undefined;
  const key = "yishun:anonymousId";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const generated = `anon_${crypto.randomUUID()}`;
  window.localStorage.setItem(key, generated);
  return generated;
}


const ZH_VALUE_MAP: Record<string, string> = {
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
  East: "东方",
  South: "南方",
  "Center / Northeast": "中宫 / 东北",
  West: "西方",
  North: "北方",
  planning: "规划",
  learning: "学习",
  "slow decisions": "慢决策",
  presenting: "表达展示",
  "creative momentum": "创意推进",
  "warm outreach": "温和沟通",
  "reviewing details": "复核细节",
  budgeting: "预算安排",
  "stable commitments": "稳定承诺",
  prioritizing: "确定优先级",
  "negotiating boundaries": "协商边界",
  "focused execution": "专注执行",
  research: "调研",
  reflection: "反思",
  "sensitive conversations": "敏感沟通",
  "focused outreach": "专注沟通",
  "calm decisions": "冷静决策",
  "planning · focused outreach": "规划 · 专注沟通",
  timing: "时机",
};

const ZH_ACTION_MAP: Record<string, string> = {
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
  "Use as a broad day signal — birth time is unknown": "出生时间未知：请把它作为当天整体信号参考",
  "Choose one meaningful push and write the next step before you commit.": "选择一个最重要的推进点，并在承诺前写下下一步。",
  "Do not force a final answer before the options are clear.": "选项还不清楚前，不要强行给出最终答案。",
};

function zhValue(value: string | null | undefined, fallback = "综合") {
  if (!value) return fallback;
  return ZH_VALUE_MAP[value] ?? value;
}

function localizedValue(value: string | null | undefined, isZh: boolean, fallback = "General") {
  if (!isZh) return stripChineseText(value, fallback);
  return zhValue(value, fallback === "General" ? "综合" : fallback);
}

function localizedAction(value: string | null | undefined, isZh: boolean) {
  if (!value) return isZh ? "可根据完整命盘查看今日行动建议。" : "General guidance is available in your full chart.";
  if (!isZh) return toSentenceCase(value);
  return ZH_ACTION_MAP[value] ?? value;
}

function localizedWhy(preview: PreviewData, isZh: boolean) {
  if (!isZh) return stripChineseText(preview.dailySignal.why, "Today’s timing signal is ready for reflection.");
  return `你的命盘今日更适合借用${zhValue(preview.dailySignal.luckyElement, "有利五行")}能量。这个信号综合了日主、五行平衡、阴阳节律和真太阳时出生信息，用于辅助反思而非固定预测。`;
}

function localizedInsight(preview: PreviewData, isZh: boolean) {
  if (!isZh) return stripChineseText(preview.dailySignal.deeperInsight, "The unlocked layer adds context for timing, focus, and follow-through.");
  return "进阶层会把十神结构转成更容易理解的行动模式，帮助你判断今天适合推进、等待还是复盘。请把它当作反思提示，而不是确定性的命运判断。";
}

function localizedDisclaimer(value: string | null | undefined, isZh: boolean) {
  if (!isZh) return stripChineseText(value, "For reflection only. Not financial, medical, legal, or psychological advice.");
  return "仅供娱乐和自我反思；不构成医疗、金融、法律或重大人生决策建议。";
}


const ZH_DAY_MASTER_MAP: Record<string, string> = {
  Jia: "甲",
  Yi: "乙",
  Bing: "丙",
  Ding: "丁",
  Wu: "戊",
  Ji: "己",
  Geng: "庚",
  Xin: "辛",
  Ren: "壬",
  Gui: "癸",
  Yang: "阳",
  Yin: "阴",
  Wood: "木",
  Fire: "火",
  Earth: "土",
  Metal: "金",
  Water: "水",
};

function localizedDayMaster(value: string | null | undefined, isZh: boolean) {
  if (!value) return isZh ? "已计算" : "calculated";
  if (!isZh) return stripChineseText(value, "calculated");
  return value.replace(/Yang|Yin|Jia|Bing|Ding|Geng|Gui|Earth|Metal|Water|Wood|Fire|Xin|Ren|Yi|Wu|Ji/g, (match) => ZH_DAY_MASTER_MAP[match] ?? match).replace(/\s*\(([^)]+)\)/g, "（$1）").replace(/阴\s+/g, "阴").replace(/阳\s+/g, "阳");
}

function localizedProfileDescription(preview: PreviewData, isZh: boolean) {
  if (!isZh) return stripChineseText(preview.interpretation.dayMasterDescription, "Your full profile is calculated and ready for English guidance.");
  return `你的出生资料已完成排盘。当前日主为 ${localizedDayMaster(preview.dayMaster, true)}，系统会结合四柱、五行与今日节律生成行动提示。`;
}

function localizedElementSummary(preview: PreviewData, isZh: boolean) {
  if (!isZh) return buildElementSummary(preview);
  const dominant = cleanElementName(preview.dominantElement) ?? fallbackElementFromBalance(preview.elementsBalance, "dominant");
  const missing = cleanElementName(preview.missingElement) ?? fallbackElementFromBalance(preview.elementsBalance, "weak");
  const favorable = cleanElementName(preview.favorableElement) ?? cleanElementName(preview.dailySignal.luckyElement) ?? missing;
  const parts = [
    dominant ? `最强：${zhValue(dominant)}` : null,
    missing ? `需补：${zhValue(missing)}` : null,
    favorable ? `今日有利：${zhValue(favorable)}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function localizedPillarName(name: string, isZh: boolean) {
  if (!isZh) return name;
  const map: Record<string, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };
  return map[name] ?? name;
}

function localizedTrueSolarOffset(minutes: number, isZh: boolean) {
  if (!isZh) return formatTrueSolarOffset(minutes);
  const abs = Math.abs(minutes);
  if (abs < 0.01) return "本命盘没有明显真太阳时偏移。";
  return `真太阳时比钟表时间${minutes > 0 ? "晚" : "早"} ${abs.toFixed(2)} 分钟。`;
}

const ELEMENT_LABELS: Record<string, string> = {
  wood: "Wood",
  fire: "Fire",
  earth: "Earth",
  metal: "Metal",
  water: "Water",
  木: "Wood",
  火: "Fire",
  土: "Earth",
  金: "Metal",
  水: "Water",
  Wood: "Wood",
  Fire: "Fire",
  Earth: "Earth",
  Metal: "Metal",
  Water: "Water",
};

function cleanElementName(value: string | null | undefined) {
  const key = value?.trim().replace(/[().。]/g, "");
  return key ? ELEMENT_LABELS[key] ?? key : null;
}

function fallbackElementFromBalance(balance: PreviewData["elementsBalance"], mode: "dominant" | "weak") {
  const entries = (Object.entries(balance) as Array<[keyof PreviewData["elementsBalance"], number]>).sort((a, b) => b[1] - a[1]);
  const selected = mode === "dominant" ? entries[0] : entries[entries.length - 1];
  return selected ? ELEMENT_LABELS[selected[0]] : null;
}

function buildElementSummary(preview: PreviewData) {
  const dominant = cleanElementName(preview.dominantElement) ?? fallbackElementFromBalance(preview.elementsBalance, "dominant");
  const missing = cleanElementName(preview.missingElement) ?? fallbackElementFromBalance(preview.elementsBalance, "weak");
  const favorable = cleanElementName(preview.favorableElement) ?? cleanElementName(preview.dailySignal.luckyElement) ?? missing;
  const parts = [
    dominant ? `Strongest: ${dominant}` : null,
    missing ? `Needs support: ${missing}` : null,
    favorable ? `Today's helpful element: ${favorable}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function formatTrueSolarOffset(minutes: number) {
  const abs = Math.abs(minutes);
  if (abs < 0.01) return "No meaningful true-solar-time shift for this profile.";
  return `True solar time shifts ${abs.toFixed(2)} minutes ${minutes > 0 ? "later" : "earlier"} than clock time.`;
}

function stripChineseText(value: string | null | undefined, fallback = "Available in your full chart") {
  const cleaned = value?.replace(/[\u3400-\u9fff]+/g, "").replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

function toSentenceCase(value: string | null | undefined) {
  const cleaned = stripChineseText(value, "General guidance is available in your full chart.");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getSavedHistory(): DailyArchiveItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem("yishun:dailyRitual:history");
    const parsed = saved ? (JSON.parse(saved) as DailyArchiveItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCachedPreview() {
  if (typeof window === "undefined") return null;
  try {
    const cached = window.localStorage.getItem("yishun:p0Preview");
    return cached ? (JSON.parse(cached) as PreviewData) : null;
  } catch {
    return null;
  }
}

function calculateStreak(history: DailyArchiveItem[], includeToday = true) {
  const dates = new Set(history.map((item) => item.date));
  if (includeToday) dates.add(todayKey());
  let streak = 0;
  const cursor = new Date(`${todayKey()}T00:00:00`);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function ReadingResultPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isZh = locale === "zh-CN";
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [savePanelOpen, setSavePanelOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<DailyArchiveItem[]>(() => getSavedHistory());

  useEffect(() => {
    window.setTimeout(() => {
      setPreview(readCachedPreview());
      setPreviewLoaded(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!previewLoaded) return;
    if (!preview) {
      router.replace("/reading/start");
      return;
    }
    const aiStatus = preview.ai?.status ?? "missing";
    track("streak_view", {
      streak: calculateStreak(getSavedHistory(), true),
      score: preview.dailySignal.score,
      focus: preview.focus ?? "General",
      source: "reading_result",
    });
    trackYiShunEvent(YISHUN_EVENTS.FUNNEL_VIEW, { screen: "reading_result", score: preview.dailySignal.score, focus: preview.focus ?? "General" });
    trackYiShunEvent(YISHUN_EVENTS.AI_STATUS, {
      screen: "reading_result",
      status: aiStatus,
      provider: preview.ai?.provider ?? "none",
      cost_guard: aiStatus !== "ok",
    });
    trackYiShunEvent(YISHUN_EVENTS.PAYWALL_VIEW, {
      placement: "result_premium_card",
      product: "report_single",
      price_display: "$4.99",
      ai_status: aiStatus,
    });
  }, [preview, previewLoaded, router]);

  const pillars = useMemo(() => {
    if (!preview) return [];
    return Object.entries(preview.fourPillars).map(([name, value]) => ({ name, ...value }));
  }, [preview]);

  if (!preview) {
    return (
      <>
        <Background />
        <main className="relative z-10 min-h-screen grid place-items-center text-gray-300">{isZh ? "正在加载你的信号…" : "Loading your signal…"}</main>
      </>
    );
  }

  function archiveToday(reminderEmail?: string) {
    if (!preview) return;
    const item: DailyArchiveItem = {
      date: todayKey(),
      score: preview.dailySignal.score,
      bestFor: preview.dailySignal.bestFor.map((item) => localizedValue(item, isZh, "Timing")),
      focus: localizedValue(preview.focus, isZh, "General"),
      savedAt: new Date().toISOString(),
      bestHour: preview.dailySignal.bestHour,
      avoid: localizedAction(preview.dailySignal.avoid, isZh),
      action: localizedAction(preview.dailySignal.do, isZh),
    };
    const merged = [item, ...history.filter((entry) => entry.date !== item.date)].slice(0, 14);
    setHistory(merged);
    window.localStorage.setItem("yishun:dailyRitual:history", JSON.stringify(merged));
    window.localStorage.setItem("yishun:dailyRitual:completedDate", item.date);
    window.localStorage.setItem("yishun:dailyRitual:reminderOptIn", reminderEmail ? "email" : "device_only");
    if (reminderEmail) window.localStorage.setItem("yishun:dailyRitual:email", reminderEmail);
    track("save_result", { score: item.score, focus: item.focus, reminder: Boolean(reminderEmail), streak: calculateStreak(merged, true) });
    trackYiShunEvent(YISHUN_EVENTS.SAVE_CLICK, { source: "reading_result", score: item.score, reminder: Boolean(reminderEmail) });
    trackYiShunEvent(YISHUN_EVENTS.FUNNEL_SAVE, { source: "reading_result", score: item.score, reminder: Boolean(reminderEmail), streak: calculateStreak(merged, true) });
  }

  function handleSaveDeviceOnly() {
    archiveToday();
    setSavePanelOpen(false);
    setSavedMessage(isZh ? "已保存在本设备，可在报告中查看每日仪式历史。" : "Saved on this device. Your Daily Ritual history is ready in Reports.");
  }

  function handleSaveWithReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    archiveToday(email.trim());
    setSavePanelOpen(false);
    setSavedMessage(isZh ? "已保存。提醒偏好会保存在本地测试版本中。" : "Saved. Reminder preference is stored locally for the P0 test build.");
  }

  async function handleShare() {
    if (!preview || shareBusy) return;
    setShareBusy(true);
    const anonymousId = getAnonymousId();
    const payload = {
      title: isZh ? `今日${localizedValue(preview.focus, true)}时机卡` : `Today’s ${stripChineseText(preview.focus, "General")} timing card`,
      theme: localizedValue(preview.focus, isZh),
      summary: oneLineSummary,
      element_hint: localizedValue(cleanElementName(preview.dailySignal.luckyElement), isZh) ?? undefined,
      best_window: preview.dailySignal.bestHour,
      avoid_window: localizedAction(preview.dailySignal.avoid, isZh),
      action: localizedAction(preview.dailySignal.do, isZh),
      score_label: isZh ? `${preview.dailySignal.score}/100 清晰度` : `${preview.dailySignal.score}/100 clarity`,
    };
    const fallbackText = isZh
      ? `我的易顺今日时机卡：${preview.dailySignal.score}/100 清晰度 · 最佳窗口 ${preview.dailySignal.bestHour} · 避免 ${localizedAction(preview.dailySignal.avoid, true)} · 可做 ${localizedAction(preview.dailySignal.do, true)} #每日时机`
      : `My YiShun timing card today: ${preview.dailySignal.score}/100 clarity · Best window ${preview.dailySignal.bestHour} · Avoid ${toSentenceCase(preview.dailySignal.avoid)} · Try this: ${toSentenceCase(preview.dailySignal.do)} #DailyTiming`;
    let shareUrl = window.location.origin;
    let shareId: string | undefined;
    track("share_create_click", { source_screen: "bazi_result", card_type: "daily_luck", template_id: "mystic", anonymous_id: anonymousId });
    trackYiShunEvent(YISHUN_EVENTS.SHARE_CLICK, { source: "reading_result", card_type: "daily_luck" });
    trackYiShunEvent(YISHUN_EVENTS.FUNNEL_SHARE, { source: "reading_result", card_type: "daily_luck" });
    try {
      const response = await fetch("/api/v1/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_id: anonymousId,
          source_screen: "bazi_result",
          card_type: "daily_luck",
          template_id: "mystic",
          locale: navigator.language || "en-US",
          payload,
          utm: { source: "native_share", medium: "share_sheet", campaign: "p1_share_landing" },
        }),
      });
      const data = (await response.json()) as { share_id?: string; share_url?: string; error?: string };
      if (!response.ok || !data.share_url || !data.share_id) throw new Error(data.error ?? "share_create_failed");
      shareUrl = data.share_url;
      shareId = data.share_id;
      track("share_link_created", { share_id: shareId, source_screen: "bazi_result", card_type: "daily_luck", template_id: "mystic" });
    } catch (error) {
      console.warn("YiShun share link failed; falling back to plain share text.", error);
    }

    const text = `${fallbackText}\n${shareUrl}`;
    const shareData = { title: "YiShun Today Timing Card", text, url: shareUrl };
    const canSystemShare = "share" in navigator;
    if (canSystemShare) {
      await navigator.share(shareData).catch(() => navigator.clipboard?.writeText(text));
      if (shareId) track("native_share_sheet_opened", { share_id: shareId, platform: navigator.platform || "web", card_type: "daily_luck" });
    } else {
      await navigator.clipboard?.writeText(text).catch(() => undefined);
    }
    setShareCopied(true);
    setShareBusy(false);
  }

  function handleReportPreview() {
    track("reports_open", {
      placement: "post_free_value",
      report_type: "daily_ritual_history",
      source: "reading_result",
      target: "/reports",
    });
    trackYiShunEvent(YISHUN_EVENTS.REPORT_VIEW, { source: "reading_result", target: "/reports" });
    router.push("/reports");
  }

  function handlePaidReportIntent(placement: string) {
    track("paid_report_intent", {
      placement,
      product: "report_single",
      source: "reading_result",
      score: preview?.dailySignal.score,
      focus: preview?.focus ?? "General",
      ai_status: preview?.ai?.status ?? "missing",
    });
    trackYiShunEvent(YISHUN_EVENTS.PAYMENT_INTENT, {
      placement,
      product: "report_single",
      source: "reading_result",
    });
    trackYiShunEvent(YISHUN_EVENTS.CHECKOUT_START, {
      placement,
      product: "report_single",
      price_display: "$4.99",
      source: "reading_result",
    });
  }

  const elementSummary = localizedElementSummary(preview, isZh);
  const streak = calculateStreak(history, true);
  const oneLineSummary = isZh
    ? `${localizedValue(preview.focus, true)}适合${preview.dailySignal.bestFor.map((item) => localizedValue(item, true, "时机")).slice(0, 2).join(" + ")}，参考时段 ${preview.dailySignal.bestHour}。`
    : `${stripChineseText(preview.focus, "General")} favors ${preview.dailySignal.bestFor.map((item) => stripChineseText(item, "timing")).slice(0, 2).join(" + ")} during ${preview.dailySignal.bestHour}.`;
  const actionCard = {
    bestWindow: preview.dailySignal.bestHour,
    avoidWindow: localizedAction(preview.dailySignal.avoid, isZh),
    action: localizedAction(preview.dailySignal.do, isZh),
  };
  const suggestedActions = isZh
    ? [
        actionCard.action,
        `把最重要的${localizedValue(preview.focus, true)}任务安排在 ${actionCard.bestWindow} 前后。`,
        `先写下一个可验证的小步骤，再承诺更大的决定。`,
      ]
    : [
        actionCard.action,
        `Place your most important ${stripChineseText(preview.focus, "focus").toLowerCase()} task near ${actionCard.bestWindow}.`,
        "Write one verifiable next step before making a larger commitment.",
      ];
  const suitableItems = preview.dailySignal.bestFor.map((item) => localizedValue(item, isZh, "Timing")).slice(0, 3);

  const confidenceNotes = [
    !preview.birthProfile.birthTimeKnown ? (isZh ? "出生时间未知：时柱和黄金时段会采用估算午时命盘。" : "Birth time unknown: hour-pillar and golden-hour guidance use an estimated noon chart.") : null,
    !preview.birthProfile.birthPlaceText ? (isZh ? "出生地缺失：添加城市或坐标后，真太阳时精度会更高。" : "Birthplace missing: true solar time precision is lower until you add a city or advanced coordinates.") : null,
    !preview.trueSolarTime ? (isZh ? "由于位置信息不完整，真太阳时尚未完全校正。" : "True solar time was not fully adjusted because location details are incomplete.") : null,
  ].filter(Boolean);
  const aiSummary = preview.ai?.status === "ok"
    ? (isZh ? preview.ai.summary : stripChineseText(preview.ai.summary, oneLineSummary))
    : oneLineSummary;
  const aiActionSuggestions = preview.ai?.status === "ok"
    ? preview.ai.actionSuggestions.map((item) => isZh ? item : stripChineseText(item, "Use the timing signal as a reflection prompt."))
    : [];
  const aiReflectionQuestion = preview.ai?.status === "ok"
    ? (isZh ? preview.ai.reflectionQuestion : stripChineseText(preview.ai.reflectionQuestion, "What one action fits this timing window today?"))
    : "";
  const aiTerminologyNote = preview.ai?.status === "ok"
    ? (isZh ? preview.ai.terminologyNote : stripChineseText(preview.ai.terminologyNote, "Terms are explained from the structured timing signal."))
    : "";
  const aiAttribution = preview.ai?.status === "ok"
    ? (isZh ? preview.ai.attribution : stripChineseText(preview.ai.attribution, "Gemini explains the rules-engine signal; it does not decide chart facts."))
    : "";
  const ruleEvidenceItems = [
    [isZh ? "出生资料" : "Birth profile", isZh ? "用于建立个人时机基准；分享卡不会展示隐私资料。" : "Used to set the personal timing baseline; private birth details stay off share cards."],
    [isZh ? "真太阳时" : "True solar time", preview.trueSolarTime ? localizedTrueSolarOffset(preview.trueSolarTime.offsetMinutes, isZh) : (isZh ? "当前缺少完整位置，因此使用可用资料估算。" : "Location is incomplete, so the result uses the available profile estimate.")],
    [isZh ? "四柱" : "Four Pillars", isZh ? "年柱、月柱、日柱、时柱由规则引擎计算，用作长期结构背景。" : "Year, month, day, and hour pillars are computed by the rules engine as structural context."],
    [isZh ? "日主" : "Day Master", isZh ? `${localizedDayMaster(preview.dayMaster, true)} 用于判断今日信号与个人结构的配合。` : `${localizedDayMaster(preview.dayMaster, false)} anchors how today's signal fits your profile.`],
    [isZh ? "五行" : "Five Elements", elementSummary || (isZh ? "五行分布已计算。" : "Element balance is calculated.")],
    [isZh ? "今日信号" : "Today’s signal", isZh ? `清晰度 ${preview.dailySignal.score}/100；有利窗口 ${preview.dailySignal.bestHour}。` : `Clarity ${preview.dailySignal.score}/100; best window ${preview.dailySignal.bestHour}.`],
    [isZh ? "最佳窗口" : "Best window", isZh ? "由今日节律、五行提示和行动边界共同生成。" : "Generated from today’s cycle, element hint, and action boundaries."],
  ];

  return (
    <>
      <Background />
      <main className="ys-shell relative z-10 min-h-screen pb-16">
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <AppBackLink href="/reading/start" label={isZh ? "修改出生资料" : "Edit birth profile"} context={isZh ? "返回" : "Back"} />
            <LanguageSwitcher />
          </div>
        </header>

        <section className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <article className="ys-panel overflow-hidden rounded-[2rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-secondary">{isZh ? "今日决策信号" : "Today’s Decision Signal"} · {todayKey()}</p>
                <h1 className="mt-2 text-2xl font-heading font-bold text-white">{isZh ? "时机清晰度" : "Timing clarity"}: {localizedValue(preview.focus, isZh)}</h1>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">{isZh ? "免费结果已解锁" : "Free result unlocked"}</span>
            </div>
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-base leading-7 text-white">
              {aiSummary}
            </p>
            {preview.ai?.status === "ok" && (
              <div className="mt-4 rounded-[1.5rem] border border-[#e0bd72]/25 bg-[#e0bd72]/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e0bd72]">
                    {isZh ? "AI 个性化解读（基于结构化八字时机信号）" : "AI-personalized interpretation based on structured BaZi timing"}
                  </p>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold text-emerald-200">
                    {isZh ? "仅解释已提供信号" : "Explains provided signals only"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-400">
                  {isZh ? "命盘、分数、黄金时段、四柱、日主、五行与真太阳时由 YiShun 规则引擎计算；AI 不决定命盘。" : "YiShun’s rules engine computes the chart, score, best hour, Four Pillars, Day Master, Five Elements, and true solar time; AI does not decide the chart."}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-400">{isZh ? "AI 行动建议" : "AI action suggestions"}</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-white">
                      {aiActionSuggestions.map((item) => <li key={item}>{item}</li>)}
                    </ol>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-400">{isZh ? "依据与术语" : "Basis and terminology"}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-100">{aiReflectionQuestion}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-300">{aiTerminologyNote}</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-gray-500">{aiAttribution}</p>
              </div>
            )}
            <div className="mt-4 rounded-[1.5rem] border border-[#7aa48c]/25 bg-[#7aa48c]/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a8d8bd]">{isZh ? "准确性说明" : "Accuracy / evidence"}</p>
                <span className="rounded-full bg-black/25 px-3 py-1 text-[11px] font-bold text-[#d7f0e2]">{isZh ? "规则计算，AI 不改事实" : "Rules compute; AI cannot alter facts"}</span>
              </div>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-gray-200 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">{isZh ? "出生资料已标准化" : "Birth profile normalized"}</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">{preview.trueSolarTime ? (isZh ? `真太阳时 ${preview.trueSolarTime.time}` : `True solar time ${preview.trueSolarTime.time}`) : (isZh ? "真太阳时待补充地点" : "True solar time needs location")}</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">{isZh ? "四柱/五行由规则引擎生成" : "Four Pillars / elements from rules"}</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">{isZh ? "建议仅用于反思和择时" : "Use for reflection and timing only"}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <span className="text-5xl font-heading font-bold text-white text-glow sm:text-6xl">{preview.dailySignal.score}</span>
                <span className="pb-3 text-sm text-gray-400"> / 100 {isZh ? "时机清晰度" : "timing clarity"}</span>
              </div>
              <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-center">
                <p className="text-2xl font-heading font-bold text-white">{streak}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-accent">{isZh ? "连续天数" : "day streak"}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {preview.dailySignal.bestFor.slice(0, 3).map((item) => {
                const label = localizedValue(item, isZh, "Timing");
                return <span key={item} className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm text-secondary">{isZh ? "适合" : "Best for"} {label}</span>;
              })}
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent">{isZh ? "黄金时段" : "Golden hour"}: {preview.dailySignal.bestHour}</span>
            </div>
            <div className="mt-5 rounded-[2rem] border border-white/15 bg-black/25 p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-secondary/80">{isZh ? "行动卡" : "Action Card"}</p>
              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                  <p className="text-xs font-bold uppercase text-secondary">{isZh ? "最佳窗口" : "Best window"}</p>
                  <p className="mt-2 text-lg font-heading font-bold text-white">{actionCard.bestWindow}</p>
                </div>
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
                  <p className="text-xs font-bold uppercase text-accent">{isZh ? "避开窗口" : "Avoid window"}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-200">{actionCard.avoidWindow}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase text-gray-300">{isZh ? "今日摘要 / 一项行动" : "Today’s summary / One action"}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-200">{oneLineSummary}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
                  <p className="text-xs font-bold uppercase text-secondary">{isZh ? "3 条行动建议" : "3 practical actions"}</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-100">
                    {suggestedActions.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </div>
                <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4">
                  <p className="text-xs font-bold uppercase text-accent">{isZh ? "适合 / 避免" : "Best for / avoid"}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-100">{isZh ? "适合：" : "Best for: "}{suitableItems.join(" · ")}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-200">{isZh ? "避免：" : "Avoid: "}{actionCard.avoidWindow}</p>
                </div>
              </div>
            </div>

            <section className="mt-5 rounded-[2rem] border border-secondary/25 bg-secondary/10 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-secondary/90">{isZh ? "结果依据" : "Why this result?"}</p>
                  <h2 className="mt-2 text-2xl font-heading font-bold text-white">
                    {isZh ? "这些规则让准确性可感知。" : "The signal is traceable, not a black box."}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300">
                  {isZh ? "Gemini 只解释，不决定事实" : "Gemini explains; it does not decide facts"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-300">
                {isZh
                  ? "出生资料、真太阳时、四柱、日主、五行和今日信号由 YiShun 规则引擎计算；Gemini 只把这些已计算事实转成更容易理解的个性化说明。"
                  : "Birth data, true solar time, Four Pillars, Day Master, Five Elements, today’s signal, and the best window are computed by YiShun’s rules engine. Gemini only turns those facts into a personalized explanation."}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {ruleEvidenceItems.map(([label, body]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">{label}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-100">{body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#e0bd72]/30 bg-gradient-to-br from-[#e0bd72]/15 via-white/[0.04] to-secondary/10 p-5">
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e0bd72]">{isZh ? "进阶报告" : "Premium report"}</p>
                  <h2 className="mt-2 text-2xl font-heading font-bold text-white">
                    {isZh ? "把今日信号升级成可执行计划。" : "Turn this signal into an actionable plan."}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-gray-300">
                    {isZh ? "免费版保留今日最佳窗口和一项行动；付费报告会展开未来 7 天节奏、关键日期、风险提示和可保存的行动清单。" : "The free result gives today’s window and one action. The paid report expands this into a 7-day rhythm, key dates, risk notes, and a saveable action checklist."}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-gray-200 sm:grid-cols-3">
                    {(isZh
                      ? ["7 天择时路线", "PDF/长图保存", "Gemini 个性化扩写"]
                      : ["7-day timing plan", "PDF/image-ready summary", "Gemini-personalized expansion"]
                    ).map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">✓ {item}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{isZh ? "推荐单次购买" : "Recommended one-time unlock"}</p>
                  <p className="mt-2 text-3xl font-heading font-bold text-white">{isZh ? "完整报告" : "Full report"}</p>
                  <p className="mt-1 text-2xl font-black text-[#e0bd72]">US$4.99</p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">{isZh ? "单次购买：7 天择时路线、关键日期、风险提示和可保存清单。适合先验证价值，不强推订阅。" : "One-time purchase: 7-day timing plan, key dates, risk notes, and a saveable checklist. Best for proving value before a subscription."}</p>
                  <StripeCheckoutButton
                    product="report_single"
                    clientReferenceId={getAnonymousId()}
                    onStart={() => handlePaidReportIntent("result_premium_card")}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-black text-white shadow-xl shadow-black/25"
                    fallbackLabel={isZh ? "支付暂未配置，请先保存报告，稍后再试。" : "Checkout is not configured yet. Save your result and try again later."}
                  >
                    {isZh ? "解锁完整报告" : "Unlock full report"}
                  </StripeCheckoutButton>
                  <p className="mt-3 text-[11px] leading-5 text-gray-500">{isZh ? "成本护栏已启用：缓存、采样、超时和规则兜底。" : "Cost guard enabled: cache, sampling, timeout, and rules fallback."}</p>
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                [isZh ? "今日节奏" : "Today rhythm", oneLineSummary],
                [isZh ? "关键洞察" : "Key insight", localizedWhy(preview, isZh)],
                [isZh ? "行动边界" : "Action boundary", `${isZh ? "适合" : "Best"}: ${suitableItems.join(" · ")} · ${isZh ? "避免" : "Avoid"}: ${actionCard.avoidWindow}`],
              ].map(([title, body]) => (
                <div key={title} className="ys-panel-soft rounded-3xl p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e0bd72]">{title}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-200">{body}</p>
                </div>
              ))}
            </div>
            {confidenceNotes.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">
                {confidenceNotes.map((note) => <p key={note}>{note}</p>)}
              </div>
            )}
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              <button onClick={() => setSavePanelOpen(true)} className="rounded-2xl bg-gradient-to-r from-secondary to-accent px-4 py-3 text-sm font-bold text-white">{isZh ? "保存资料供明天使用" : "Save my profile for tomorrow"}</button>
              <button onClick={handleShare} disabled={shareBusy} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-extrabold text-gray-100 transition hover:-translate-y-0.5 hover:border-[#e0bd72]/45 hover:bg-white/[0.08] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
                {shareBusy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
                {shareBusy ? (isZh ? "正在创建链接…" : "Creating link…") : shareCopied ? (isZh ? "分享链接已就绪" : "Share link ready") : (isZh ? "分享今日卡片" : "Share today’s card")}
              </button>
              <Link href="/samples" className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-gray-200 hover:bg-white/5">{isZh ? "查看样例报告" : "View sample reports"}</Link>
            </div>
            {savedMessage && <p className="mt-4 rounded-xl border border-secondary/30 bg-secondary/10 p-3 text-sm text-secondary">{savedMessage}</p>}
          </article>

          <section className="ys-share-card rounded-3xl p-5 sm:p-6" aria-label="Shareable YiShun timing card">
            <div className="mx-auto max-w-sm rounded-[2rem] border border-white/15 bg-black/25 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.25em] text-accent">{isZh ? "易顺时机卡" : "YiShun Timing Card"}</p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{todayKey()}</span>
              </div>
              <p className="mt-5 text-5xl font-heading font-bold text-glow">{preview.dailySignal.score}</p>
              <p className="mt-2 text-sm text-gray-300">{isZh ? "今日清晰度评分" : "Today’s clarity score"}</p>
              <div className="mt-5 space-y-3 text-sm">
                <p><span className="text-secondary">{isZh ? "最佳：" : "Best:"}</span> {actionCard.bestWindow}</p>
                <p><span className="text-accent">{isZh ? "避免：" : "Avoid:"}</span> {actionCard.avoidWindow}</p>
                <p><span className="text-white">{isZh ? "尝试：" : "Try:"}</span> {actionCard.action}</p>
              </div>
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-gray-400">{isZh ? "不会展示出生日期或隐私细节。你可以截图或分享这张卡。" : "No birth date or private details shown. Screenshot or share this card."}</p>
            </div>
            <div className="mt-4 flex justify-center">
              <button onClick={handleShare} disabled={shareBusy} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-surface shadow-[0_16px_45px_rgba(255,255,255,0.16)] transition hover:-translate-y-0.5 hover:bg-[#f5efe1] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
                {shareBusy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-surface/30 border-t-surface" aria-hidden="true" />}
                {shareBusy ? (isZh ? "正在创建链接…" : "Creating link…") : shareCopied ? (isZh ? "已复制 / 已分享" : "Copied / shared") : (isZh ? "复制或系统分享卡片文字" : "Copy or system-share card text")}
              </button>
            </div>
          </section>

          {savePanelOpen && (
            <section className="rounded-3xl border border-secondary/30 bg-surface/90 p-5 sm:p-6 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-accent/80">{isZh ? "每日仪式提醒" : "Daily Ritual reminder"}</p>
              <h2 className="mt-2 text-2xl font-heading font-bold text-white">{isZh ? "把它保存为你的每日仪式？" : "Keep this as your daily ritual?"}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-300">{isZh ? "保存出生资料后，易顺明天可以直接生成新的信号。" : "Save your birth profile so YiShun can generate tomorrow’s signal without asking again."}</p>
              <form onSubmit={handleSaveWithReminder} className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
                <button className="rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-white">{isZh ? "保存并明天提醒我" : "Save and remind me tomorrow"}</button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <button onClick={handleSaveDeviceOnly} className="text-sm text-gray-300 hover:text-white">{isZh ? "暂不提醒，仅保存在本设备" : "Not now — keep it on this device"}</button>
                <span className="text-xs text-gray-500">{isZh ? "不会发送垃圾信息，你可以随时删除资料。" : "No spam. You can delete your profile anytime."}</span>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-secondary/30 bg-gradient-to-r from-secondary/15 via-white/[0.04] to-accent/10 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-secondary/90">{isZh ? "形成每日仪式" : "Make it a ritual"}</p>
                <h2 className="mt-2 text-2xl font-heading font-bold text-white">{isZh ? "明天回来查看新的时机信号。" : "Come back tomorrow for a fresh timing signal."}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">{isZh ? "保存今日结果，保留连续记录，并比较每天适合的行动如何变化。" : "Save today’s result, keep a simple streak, and compare how your best actions shift day by day."}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-3xl font-heading font-bold text-white">{streak}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{isZh ? "连续天数" : "day streak"}</p>
              </div>
            </div>
            <div className="mt-5 grid sm:grid-cols-3 gap-3">
              <button onClick={handleSaveDeviceOnly} className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-surface shadow-[0_16px_45px_rgba(255,255,255,0.14)] transition hover:-translate-y-0.5 hover:bg-[#f5efe1] active:translate-y-0">{isZh ? "保存今日卡片" : "Save today’s card"}</button>
              <Link href="/reports" className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-gray-200 hover:bg-white/5">{isZh ? "查看保存历史" : "View saved history"}</Link>
              <Link href="/reading/start" className="rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-center text-sm font-semibold text-secondary">{isZh ? "明天再来" : "Return tomorrow"}</Link>
            </div>
          </section>

          <section className="grid lg:grid-cols-[0.95fr_1.05fr] gap-5">
            <aside className="space-y-5">
              <div className="glass card p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-accent/80">{isZh ? "出生资料" : "Birth Profile"}</p>
                <h2 className="mt-2 text-xl font-heading font-bold text-white">{isZh ? "命盘资料" : "Birth chart profile"}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">{localizedProfileDescription(preview, isZh)}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {pillars.map((pillar) => (
                    <div key={pillar.name} className="rounded-xl bg-white/5 p-3">
                      <p className="capitalize text-gray-500">{localizedPillarName(pillar.name, isZh)}</p>
                      <p className="mt-1 text-white font-semibold">{isZh ? "已计算" : "Calculated"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass card p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-secondary/80">{isZh ? "真太阳时" : "True Solar Time"}</p>
                {preview.trueSolarTime ? (
                  <div className="mt-2 text-sm text-gray-300 space-y-2">
                    <p>{isZh ? "真太阳时：" : "True solar time:"} <span className="text-white font-semibold">{preview.trueSolarTime.date} {preview.trueSolarTime.time}</span>.</p>
                    <p>{localizedTrueSolarOffset(preview.trueSolarTime.offsetMinutes, isZh)}</p>
                    <p className="text-xs text-gray-500">{isZh ? "时区偏移采用 JS Date.getTimezoneOffset 语义：UTC - 本地时间。" : "Timezone offset uses JS Date.getTimezoneOffset semantics: UTC - local."}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">{isZh ? "添加城市或坐标可以提高精度；免费信号仍可使用。" : "Add city or coordinates to raise precision. Your free signal remains available."}</p>
                )}
              </div>
            </aside>

            <div className="space-y-5">
              <div className="glass card p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-accent/80">{isZh ? "五行" : "Five Elements"}</p>
                <FiveElementsChart balance={preview.elementsBalance} />
                {elementSummary && <p className="mt-3 text-sm text-gray-300">{elementSummary}</p>}
              </div>

              <div className="glass card p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-secondary/80">{isZh ? "白话结构" : "Plain-English pattern"}</p>
                <h2 className="mt-2 text-xl font-heading font-bold text-white">{isZh ? "白话结构" : "Plain-English pattern"}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-300">{localizedInsight(preview, isZh)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-surface/70 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-accent/80">{isZh ? "免费历史" : "Free history"}</p>
            <h2 className="mt-2 text-2xl font-heading font-bold text-white">{isZh ? "保存今天，明天对比。" : "Save today and compare tomorrow."}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">{isZh ? "P0 阶段保留核心免费仪式：今日最佳窗口、避开窗口和一个实际行动。此处刻意不展示支付和点数购买。" : "P0 keeps the core ritual free: today’s best timing window, avoid window, and one practical action. Payments and credit purchases are intentionally not shown."}</p>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <button onClick={handleReportPreview} className="rounded-2xl bg-gradient-to-r from-secondary to-accent px-4 py-3 text-center text-sm font-bold text-white">{isZh ? "打开保存历史" : "Open saved history"}</button>
              <Link href="/reading/start" className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-gray-200 hover:bg-white/5">{isZh ? "生成明日信号" : "Generate tomorrow’s signal"}</Link>
            </div>
          </section>

          <p className="text-center text-xs text-gray-500">{localizedDisclaimer(preview.dailySignal.disclaimer, isZh)}</p>
        </section>
      </main>
    </>
  );
}
