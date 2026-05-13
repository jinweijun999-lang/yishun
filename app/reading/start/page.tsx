"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Background from "../../components/Background";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { queueP0Analytics } from "@/lib/p0-analytics";

type BirthPayload = {
  birthDate: string;
  birthTime: string | null;
  birthTimeKnown: boolean;
  birthPlaceText: string;
  longitude: number | null;
  latitude: number | null;
  timezoneOffsetMinutes: number;
  timezoneName: string;
  gender: "male" | "female" | "other";
  locale: "en";
  focus: string;
};

const focusOptions = ["Work", "Money", "Love", "Energy", "Creativity", "General"];
const loadingSteps = [
  "Finding today’s best timing…",
  "Checking your solar-time rhythm…",
  "Turning it into one clear action…",
];

const currentYear = new Date().getFullYear();
const birthYears = Array.from({ length: 121 }, (_, index) => String(currentYear - index));
const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function daysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm text-gray-300">
      <span>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="input-field min-h-[52px] disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function track(event: string, properties: Record<string, unknown> = {}) {
  queueP0Analytics(event, properties);
}

function toNumberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ReadingStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthHour, setBirthHour] = useState("");
  const [birthMinute, setBirthMinute] = useState("");
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [birthPlaceText, setBirthPlaceText] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [timezoneOffsetMinutes, setTimezoneOffsetMinutes] = useState(() => {
    if (typeof window === "undefined") return "";
    return String(new Date().getTimezoneOffset());
  });
  const [timezoneName, setTimezoneName] = useState(() => {
    if (typeof window === "undefined") return "";
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  });
  const [gender, setGender] = useState<"male" | "female" | "other">("other");
  const [focus, setFocus] = useState("General");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const dayOptions = useMemo(() => {
    const total = daysInMonth(birthYear, birthMonth);
    return Array.from({ length: total }, (_, index) => String(index + 1).padStart(2, "0"));
  }, [birthMonth, birthYear]);

  const birthDate = useMemo(() => {
    if (!birthYear || !birthMonth || !birthDay) return "";
    if (!dayOptions.includes(birthDay)) return "";
    return `${birthYear}-${birthMonth}-${birthDay}`;
  }, [birthDay, birthMonth, birthYear, dayOptions]);

  const birthTime = useMemo(() => {
    if (!birthTimeKnown || !birthHour || !birthMinute) return "";
    return `${birthHour}:${birthMinute}`;
  }, [birthHour, birthMinute, birthTimeKnown]);

  useEffect(() => {
    if (!isSubmitting) return;
    const timer = window.setInterval(() => {
      setLoadingStep((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  const trueSolarPreview = useMemo(() => {
    const lon = Number(longitude);
    const tz = Number(timezoneOffsetMinutes);
    if (!Number.isFinite(lon) || !Number.isFinite(tz)) return null;
    const timezoneMeridian = (-tz / 60) * 15;
    const longitudeCorrection = (timezoneMeridian - lon) * 4;
    return `${longitudeCorrection >= 0 ? "+" : ""}${longitudeCorrection.toFixed(1)} min longitude correction before equation-of-time adjustment`;
  }, [longitude, timezoneOffsetMinutes]);

  function trackFormStart() {
    if (hasTrackedStart) return;
    setHasTrackedStart(true);
    const shareId = searchParams.get("share_id") ?? undefined;
    track("ritual_start", { source: searchParams.get("ref") === "share" ? "share_landing" : "reading_start", locale: "en", share_id: shareId });
    if (shareId) track("shared_user_generate_started", { share_id: shareId, entry_screen: "reading_start", locale: "en" });
  }

  function nextStep(next: number) {
    if (step === 1 && !birthDate) {
      setError("Please add your birth date to generate the core chart.");
      track("birth_form_error", { step: 1, reason: "missing_birth_date" });
      return;
    }
    setError(null);
    track("birth_step_completed", { step, source: "reading_start" });
    setStep(next);
  }

  async function submitReading() {
    if (!birthDate) {
      setError("Please add your birth date to generate the core chart.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setLoadingStep(0);
    track("birth_step_completed", { step: 3, source: "reading_start" });
    track("ritual_submit", {
      birth_time_known: birthTimeKnown,
      has_place: Boolean(birthPlaceText),
      focus,
      locale: "en",
      source: searchParams.get("ref") === "share" ? "share_landing" : "reading_start",
      share_id: searchParams.get("share_id") ?? undefined,
    });

    const payload: BirthPayload = {
      birthDate,
      birthTime: birthTimeKnown && birthTime ? birthTime : null,
      birthTimeKnown: birthTimeKnown && Boolean(birthTime),
      birthPlaceText,
      longitude: toNumberOrNull(longitude),
      latitude: toNumberOrNull(latitude),
      timezoneOffsetMinutes: Number(timezoneOffsetMinutes || new Date().getTimezoneOffset()),
      timezoneName,
      gender,
      locale: "en",
      focus,
    };

    const startedAt = Date.now();
    try {
      const response = await fetch("/api/bazi/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "We couldn’t generate your signal. Your information is safe — please try again.");
      localStorage.setItem("yishun:p0BirthProfile", JSON.stringify(payload));
      localStorage.setItem("yishun:p0Preview", JSON.stringify({ ...data, focus }));
      localStorage.setItem("yishun:dailyRitual:lastGeneratedAt", new Date().toISOString());
      track("ritual_complete", {
        score: data.dailySignal?.score,
        best_hour: data.dailySignal?.bestHour,
        lucky_element: data.dailySignal?.luckyElement,
        focus,
        source: searchParams.get("ref") === "share" ? "share_landing" : "reading_start",
        share_id: searchParams.get("share_id") ?? undefined,
      });
      if (data.trueSolarTime) {
        track("true_solar_time_confirmed", {
          offset_minutes: data.trueSolarTime.offsetMinutes,
          changed_hour_pillar: data.trueSolarTime.changedHourPillar,
          changed_day_boundary: data.trueSolarTime.changedDayBoundary,
        });
      }
      const remaining = Math.max(0, 950 - (Date.now() - startedAt));
      window.setTimeout(() => router.push("/reading/result"), remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t generate your signal. Your information is safe — please try again.");
      track("birth_form_error", { step, reason: err instanceof Error ? err.message : "unknown" });
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-28 sm:pb-16">
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-sm text-gray-300 hover:text-white">← YiShun</Link>
            <LanguageSwitcher />
          </div>
        </header>

        <section className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="rounded-3xl border border-accent/20 bg-surface/70 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-accent/80">Daily Return Hook</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-white text-glow">
              Find today’s best timing in 60 seconds.
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Enter only what we need. YiShun gives you one best window, one avoid window, and one action to try today.
            </p>
          </div>

          {isSubmitting ? (
            <div className="glass card p-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 animate-pulse rounded-full border border-secondary/40 bg-secondary/10" />
              <p className="text-lg font-heading font-bold text-white">{loadingSteps[loadingStep]}</p>
              <p className="text-sm text-gray-400">YiShun explains patterns for reflection — not fixed destiny.</p>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (step < 3) {
                  nextStep(step + 1);
                  return;
                }
                void submitReading();
              }}
              onFocus={trackFormStart}
              className="glass card p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {[1, 2, 3].map((item) => (
                  <span key={item} className={`rounded-full px-3 py-1 ${step === item ? "bg-secondary text-white" : "bg-white/5"}`}>Step {item}</span>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-white">First, your birth moment.</h2>
                    <p className="mt-2 text-sm text-gray-400">This sets your personal rhythm. If you do not know the time, we will still give a useful daily signal.</p>
                  </div>
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Birth date</h3>
                        <p className="mt-1 text-xs text-gray-500">Pick from menus — no format typing required.</p>
                      </div>
                      {birthDate && <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs text-secondary">{birthDate}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <SelectField label="Year" value={birthYear} onChange={(value) => { setBirthYear(value); if (birthMonth && birthDay && Number(birthDay) > daysInMonth(value, birthMonth)) setBirthDay(""); }} options={birthYears} placeholder="Year" />
                      <SelectField label="Month" value={birthMonth} onChange={(value) => { setBirthMonth(value); if (birthYear && birthDay && Number(birthDay) > daysInMonth(birthYear, value)) setBirthDay(""); }} options={months} placeholder="Month" />
                      <SelectField label="Day" value={birthDay} onChange={setBirthDay} options={dayOptions} placeholder="Day" />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Birth time</h3>
                        <p className="mt-1 text-xs text-gray-500">Select hour and minute separately — no colon needed.</p>
                      </div>
                      {birthTimeKnown && birthTime && <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">{birthTime}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Hour" value={birthHour} onChange={setBirthHour} options={hours} placeholder="Hour" disabled={!birthTimeKnown} />
                      <SelectField label="Minute" value={birthMinute} onChange={setBirthMinute} options={minutes} placeholder="Minute" disabled={!birthTimeKnown} />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
                    <input type="checkbox" checked={!birthTimeKnown} onChange={(e) => setBirthTimeKnown(!e.target.checked)} />
                    I’m not sure — use an estimated noon chart.
                  </label>
                  <button type="submit" className="sticky bottom-4 z-50 w-full rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white shadow-2xl shadow-black/40 sm:static sm:shadow-none">Continue</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-white">Where were you born?</h2>
                    <p className="mt-2 text-sm text-gray-400">A city is enough. It helps us tune the timing window without making this feel like paperwork.</p>
                  </div>
                  <label className="space-y-2 text-sm text-gray-300 block">
                    <span>Birthplace</span>
                    <input value={birthPlaceText} onChange={(e) => setBirthPlaceText(e.target.value)} placeholder="City, country" className="input-field" />
                  </label>
                  <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-secondary hover:text-secondary/80">
                    {showAdvanced ? "Hide advanced solar-time fields" : "Edit advanced solar-time fields"}
                  </button>
                  {showAdvanced && (
                    <div className="grid sm:grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="space-y-2 text-sm text-gray-300">
                        <span>Longitude</span>
                        <input type="number" step="0.01" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Optional" className="input-field" />
                      </label>
                      <label className="space-y-2 text-sm text-gray-300">
                        <span>Latitude</span>
                        <input type="number" step="0.01" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Optional" className="input-field" />
                      </label>
                      <label className="space-y-2 text-sm text-gray-300">
                        <span>Timezone</span>
                        <input value={timezoneName} onChange={(e) => setTimezoneName(e.target.value)} placeholder="America/New_York" className="input-field" />
                      </label>
                      <label className="space-y-2 text-sm text-gray-300">
                        <span>Timezone offset minutes</span>
                        <input type="number" value={timezoneOffsetMinutes} onChange={(e) => setTimezoneOffsetMinutes(e.target.value)} className="input-field" />
                      </label>
                      {trueSolarPreview && <p className="sm:col-span-2 text-xs text-gray-400">{trueSolarPreview}. Offset uses JS Date.getTimezoneOffset semantics.</p>}
                    </div>
                  )}
                  <div className="sticky bottom-4 z-50 flex gap-3 rounded-3xl bg-surface/90 p-2 shadow-2xl shadow-black/40 backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
                    <button type="button" onClick={() => setStep(1)} className="rounded-2xl border border-white/20 px-5 py-4 text-sm text-gray-300">Back</button>
                    <button type="submit" className="flex-1 rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white">Continue</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-white">What do you want to time today?</h2>
                    <p className="mt-2 text-sm text-gray-400">Pick a theme. The result stays simple: best window, avoid window, one action.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {focusOptions.map((option) => (
                      <button key={option} type="button" onClick={() => setFocus(option)} className={`rounded-2xl border px-4 py-3 text-sm ${focus === option ? "border-secondary bg-secondary/20 text-white" : "border-white/10 bg-white/5 text-gray-300"}`}>
                        {option}
                      </button>
                    ))}
                  </div>
                  <label className="space-y-2 text-sm text-gray-300 block">
                    <span>Gender (optional)</span>
                    <select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female" | "other")} className="input-field">
                      <option value="other">Prefer not to say</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </label>
                  <div className="sticky bottom-4 z-50 flex gap-3 rounded-3xl bg-surface/90 p-2 shadow-2xl shadow-black/40 backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
                    <button type="button" onClick={() => setStep(2)} className="rounded-2xl border border-white/20 px-5 py-4 text-sm text-gray-300">Back</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white shadow-lg disabled:opacity-60">
                      Find my best timing
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            </form>
          )}
        </section>
      </main>
    </>
  );
}
