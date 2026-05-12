"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Background from "../../components/Background";
import FiveElementsChart from "../../components/FiveElementsChart";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { queueP0Analytics } from "@/lib/p0-analytics";

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
  const [preview] = useState<PreviewData | null>(() => {
    if (typeof window === "undefined") return null;
    const cached = window.localStorage.getItem("yishun:p0Preview");
    try {
      return cached ? (JSON.parse(cached) as PreviewData) : null;
    } catch {
      return null;
    }
  });
  const [shareCopied, setShareCopied] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [savePanelOpen, setSavePanelOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<DailyArchiveItem[]>(() => getSavedHistory());

  useEffect(() => {
    if (!preview) {
      router.replace("/reading/start");
      return;
    }
    track("streak_view", {
      streak: calculateStreak(getSavedHistory(), true),
      score: preview.dailySignal.score,
      focus: preview.focus ?? "General",
      source: "reading_result",
    });
  }, [preview, router]);

  const pillars = useMemo(() => {
    if (!preview) return [];
    return Object.entries(preview.fourPillars).map(([name, value]) => ({ name, ...value }));
  }, [preview]);

  if (!preview) {
    return (
      <>
        <Background />
        <main className="relative z-10 min-h-screen grid place-items-center text-gray-300">Loading your signal…</main>
      </>
    );
  }

  function archiveToday(reminderEmail?: string) {
    if (!preview) return;
    const item: DailyArchiveItem = {
      date: todayKey(),
      score: preview.dailySignal.score,
      bestFor: preview.dailySignal.bestFor.map((item) => stripChineseText(item, "Timing")),
      focus: stripChineseText(preview.focus, "General"),
      savedAt: new Date().toISOString(),
      bestHour: preview.dailySignal.bestHour,
      avoid: toSentenceCase(preview.dailySignal.avoid),
      action: toSentenceCase(preview.dailySignal.do),
    };
    const merged = [item, ...history.filter((entry) => entry.date !== item.date)].slice(0, 14);
    setHistory(merged);
    window.localStorage.setItem("yishun:dailyRitual:history", JSON.stringify(merged));
    window.localStorage.setItem("yishun:dailyRitual:completedDate", item.date);
    window.localStorage.setItem("yishun:dailyRitual:reminderOptIn", reminderEmail ? "email" : "device_only");
    if (reminderEmail) window.localStorage.setItem("yishun:dailyRitual:email", reminderEmail);
    track("save_result", { score: item.score, focus: item.focus, reminder: Boolean(reminderEmail), streak: calculateStreak(merged, true) });
  }

  function handleSaveDeviceOnly() {
    archiveToday();
    setSavePanelOpen(false);
    setSavedMessage("Saved on this device. Your Daily Ritual history is ready in Reports.");
  }

  function handleSaveWithReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    archiveToday(email.trim());
    setSavePanelOpen(false);
    setSavedMessage("Saved. Reminder preference is stored locally for the P0 test build.");
  }

  async function handleShare() {
    if (!preview || shareBusy) return;
    setShareBusy(true);
    const anonymousId = getAnonymousId();
    const payload = {
      title: `Today’s ${stripChineseText(preview.focus, "General")} timing card`,
      theme: stripChineseText(preview.focus, "General"),
      summary: oneLineSummary,
      element_hint: cleanElementName(preview.dailySignal.luckyElement) ?? undefined,
      best_window: preview.dailySignal.bestHour,
      avoid_window: toSentenceCase(preview.dailySignal.avoid),
      action: toSentenceCase(preview.dailySignal.do),
      score_label: `${preview.dailySignal.score}/100 clarity`,
    };
    const fallbackText = `My YiShun timing card today: ${preview.dailySignal.score}/100 clarity · Best window ${preview.dailySignal.bestHour} · Avoid ${toSentenceCase(preview.dailySignal.avoid)} · Try this: ${toSentenceCase(preview.dailySignal.do)} #DailyTiming`;
    let shareUrl = window.location.origin;
    let shareId: string | undefined;
    track("share_create_click", { source_screen: "bazi_result", card_type: "daily_luck", template_id: "mystic", anonymous_id: anonymousId });
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
    router.push("/reports");
  }

  const elementSummary = buildElementSummary(preview);
  const streak = calculateStreak(history, true);
  const oneLineSummary = `${stripChineseText(preview.focus, "General")} favors ${preview.dailySignal.bestFor.map((item) => stripChineseText(item, "timing")).slice(0, 2).join(" + ")} during ${preview.dailySignal.bestHour}.`;
  const actionCard = {
    bestWindow: preview.dailySignal.bestHour,
    avoidWindow: toSentenceCase(preview.dailySignal.avoid),
    action: toSentenceCase(preview.dailySignal.do),
  };

  const confidenceNotes = [
    !preview.birthProfile.birthTimeKnown ? "Birth time unknown: hour-pillar and golden-hour guidance use an estimated noon chart." : null,
    !preview.birthProfile.birthPlaceText ? "Birthplace missing: true solar time precision is lower until you add a city or advanced coordinates." : null,
    !preview.trueSolarTime ? "True solar time was not fully adjusted because location details are incomplete." : null,
  ].filter(Boolean);

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-16">
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/reading/start" className="text-sm text-gray-300 hover:text-white">← Edit birth profile</Link>
            <LanguageSwitcher />
          </div>
        </header>

        <section className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <article className="rounded-3xl border border-secondary/20 bg-gradient-to-br from-secondary/15 via-surface/80 to-accent/10 p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-secondary">Today’s Decision Signal · {todayKey()}</p>
                <h1 className="mt-2 text-2xl font-heading font-bold text-white">Timing clarity: {stripChineseText(preview.focus, "General")}</h1>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">Free result unlocked</span>
            </div>
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-base leading-7 text-white">
              {oneLineSummary}
            </p>
            <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-4">
              <div>
                <span className="text-6xl font-heading font-bold text-white text-glow">{preview.dailySignal.score}</span>
                <span className="pb-3 text-sm text-gray-400"> / 100 timing clarity</span>
              </div>
              <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-center">
                <p className="text-2xl font-heading font-bold text-white">{streak}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-accent">day streak</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {preview.dailySignal.bestFor.slice(0, 3).map((item) => {
                const label = stripChineseText(item, "Timing");
                return <span key={item} className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm text-secondary">Best for {label}</span>;
              })}
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent">Golden hour: {preview.dailySignal.bestHour}</span>
            </div>
            <div className="mt-5 rounded-[2rem] border border-white/15 bg-black/25 p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-secondary/80">Action Card</p>
              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                  <p className="text-xs font-bold uppercase text-secondary">Best window</p>
                  <p className="mt-2 text-lg font-heading font-bold text-white">{actionCard.bestWindow}</p>
                </div>
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
                  <p className="text-xs font-bold uppercase text-accent">Avoid window</p>
                  <p className="mt-2 text-sm leading-6 text-gray-200">{actionCard.avoidWindow}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase text-gray-300">One action</p>
                  <p className="mt-2 text-sm leading-6 text-gray-200">{actionCard.action}</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-gray-300">{stripChineseText(preview.dailySignal.why, "Today’s timing signal is ready for reflection.")}</p>
            {confidenceNotes.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">
                {confidenceNotes.map((note) => <p key={note}>{note}</p>)}
              </div>
            )}
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              <button onClick={() => setSavePanelOpen(true)} className="rounded-2xl bg-gradient-to-r from-secondary to-accent px-4 py-3 text-sm font-bold text-white">Save my profile for tomorrow</button>
              <button onClick={handleShare} disabled={shareBusy} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/5 disabled:opacity-60">{shareBusy ? "Creating link…" : shareCopied ? "Share link ready" : "Share today’s card"}</button>
              <Link href="/reading/start" className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-gray-200 hover:bg-white/5">See what changes tomorrow</Link>
            </div>
            {savedMessage && <p className="mt-4 rounded-xl border border-secondary/30 bg-secondary/10 p-3 text-sm text-secondary">{savedMessage}</p>}
          </article>

          <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(88,28,135,0.55))] p-5 sm:p-6 shadow-2xl" aria-label="Shareable YiShun timing card">
            <div className="mx-auto max-w-sm rounded-[2rem] border border-white/20 bg-black/30 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.25em] text-accent">YiShun Timing Card</p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{todayKey()}</span>
              </div>
              <p className="mt-5 text-5xl font-heading font-bold text-glow">{preview.dailySignal.score}</p>
              <p className="mt-2 text-sm text-gray-300">Today’s clarity score</p>
              <div className="mt-5 space-y-3 text-sm">
                <p><span className="text-secondary">Best:</span> {actionCard.bestWindow}</p>
                <p><span className="text-accent">Avoid:</span> {actionCard.avoidWindow}</p>
                <p><span className="text-white">Try:</span> {actionCard.action}</p>
              </div>
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-gray-400">No birth date or private details shown. Screenshot or share this card.</p>
            </div>
            <div className="mt-4 flex justify-center">
              <button onClick={handleShare} disabled={shareBusy} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-surface disabled:opacity-60">{shareBusy ? "Creating link…" : shareCopied ? "Copied / shared" : "Copy or system-share card text"}</button>
            </div>
          </section>

          {savePanelOpen && (
            <section className="rounded-3xl border border-secondary/30 bg-surface/90 p-5 sm:p-6 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-accent/80">Daily Ritual reminder</p>
              <h2 className="mt-2 text-2xl font-heading font-bold text-white">Keep this as your daily ritual?</h2>
              <p className="mt-2 text-sm leading-6 text-gray-300">Save your birth profile so YiShun can generate tomorrow’s signal without asking again.</p>
              <form onSubmit={handleSaveWithReminder} className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
                <button className="rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-white">Save and remind me tomorrow</button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <button onClick={handleSaveDeviceOnly} className="text-sm text-gray-300 hover:text-white">Not now — keep it on this device</button>
                <span className="text-xs text-gray-500">No spam. You can delete your profile anytime.</span>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-secondary/30 bg-gradient-to-r from-secondary/15 via-white/[0.04] to-accent/10 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-secondary/90">Make it a ritual</p>
                <h2 className="mt-2 text-2xl font-heading font-bold text-white">Come back tomorrow for a fresh timing signal.</h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">Save today’s result, keep a simple streak, and compare how your best actions shift day by day.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-3xl font-heading font-bold text-white">{streak}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">day streak</p>
              </div>
            </div>
            <div className="mt-5 grid sm:grid-cols-3 gap-3">
              <button onClick={handleSaveDeviceOnly} className="rounded-2xl bg-white text-surface px-4 py-3 text-sm font-bold">Save today’s card</button>
              <Link href="/reports" className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-gray-200 hover:bg-white/5">View saved history</Link>
              <Link href="/reading/start" className="rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-center text-sm font-semibold text-secondary">Return tomorrow</Link>
            </div>
          </section>

          <section className="grid lg:grid-cols-[0.95fr_1.05fr] gap-5">
            <aside className="space-y-5">
              <div className="glass card p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-accent/80">Birth Profile</p>
                <h2 className="mt-2 text-xl font-heading font-bold text-white">Birth chart profile</h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">{stripChineseText(preview.interpretation.dayMasterDescription, "Your full profile is calculated and ready for English guidance.")}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {pillars.map((pillar) => (
                    <div key={pillar.name} className="rounded-xl bg-white/5 p-3">
                      <p className="capitalize text-gray-500">{pillar.name}</p>
                      <p className="mt-1 text-white font-semibold">Calculated</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass card p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-secondary/80">True Solar Time</p>
                {preview.trueSolarTime ? (
                  <div className="mt-2 text-sm text-gray-300 space-y-2">
                    <p>True solar time: <span className="text-white font-semibold">{preview.trueSolarTime.date} {preview.trueSolarTime.time}</span>.</p>
                    <p>{formatTrueSolarOffset(preview.trueSolarTime.offsetMinutes)}</p>
                    <p className="text-xs text-gray-500">Timezone offset uses JS Date.getTimezoneOffset semantics: UTC - local.</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">Add city or coordinates to raise precision. Your free signal remains available.</p>
                )}
              </div>
            </aside>

            <div className="space-y-5">
              <div className="glass card p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-accent/80">Five Elements</p>
                <FiveElementsChart balance={preview.elementsBalance} />
                {elementSummary && <p className="mt-3 text-sm text-gray-300">{elementSummary}</p>}
              </div>

              <div className="glass card p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-secondary/80">Plain-English pattern</p>
                <h2 className="mt-2 text-xl font-heading font-bold text-white">Plain-English pattern</h2>
                <p className="mt-3 text-sm leading-6 text-gray-300">{stripChineseText(preview.dailySignal.deeperInsight, "The unlocked layer adds context for timing, focus, and follow-through.")}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-surface/70 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-accent/80">Free history</p>
            <h2 className="mt-2 text-2xl font-heading font-bold text-white">Save today and compare tomorrow.</h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">P0 keeps the core ritual free: today’s best timing window, avoid window, and one practical action. Payments and credit purchases are intentionally not shown.</p>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <button onClick={handleReportPreview} className="rounded-2xl bg-gradient-to-r from-secondary to-accent px-4 py-3 text-center text-sm font-bold text-white">Open saved history</button>
              <Link href="/reading/start" className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-gray-200 hover:bg-white/5">Generate tomorrow’s signal</Link>
            </div>
          </section>

          <p className="text-center text-xs text-gray-500">{stripChineseText(preview.dailySignal.disclaimer, "For reflection only. Not financial, medical, legal, or psychological advice.")}</p>
        </section>
      </main>
    </>
  );
}
