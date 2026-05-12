"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Background from "../../components/Background";
import LanguageSwitcher from "../../components/LanguageSwitcher";

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
  "Mapping your Four Pillars…",
  "Adjusting for true solar time…",
  "Translating today’s timing into plain English…",
];

function track(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.info("[YiShun funnel]", event, properties);
  window.dispatchEvent(new CustomEvent("yishun:analytics", { detail: { event, properties } }));
}

function toNumberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ReadingStartPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
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
    track("birth_form_start", { source: "reading_start", locale: "en" });
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!birthDate) {
      setError("Please add your birth date to generate the core chart.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setLoadingStep(0);
    track("birth_step_completed", { step: 3, source: "reading_start" });
    track("birth_form_complete", {
      birth_time_known: birthTimeKnown,
      has_place: Boolean(birthPlaceText),
      focus,
      locale: "en",
      source: "reading_start",
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
      track("birth_chart_generated", {
        day_master_element: data.dayMaster,
        dominant_element: data.dominantElement,
        missing_element: data.missingElement,
        focus,
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
      <main className="relative z-10 min-h-screen pb-16">
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-sm text-gray-300 hover:text-white">← YiShun</Link>
            <LanguageSwitcher />
          </div>
        </header>

        <section className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="rounded-3xl border border-accent/20 bg-surface/70 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-accent/80">60-second Daily Ritual</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-white text-glow">
              Reveal today’s decision signal.
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Three light steps: birth moment, birthplace, and today’s focus. Advanced solar-time details are optional.
            </p>
          </div>

          {isSubmitting ? (
            <div className="glass card p-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 animate-pulse rounded-full border border-secondary/40 bg-secondary/10" />
              <p className="text-lg font-heading font-bold text-white">{loadingSteps[loadingStep]}</p>
              <p className="text-sm text-gray-400">YiShun explains patterns for reflection — not fixed destiny.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} onFocus={trackFormStart} className="glass card p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {[1, 2, 3].map((item) => (
                  <span key={item} className={`rounded-full px-3 py-1 ${step === item ? "bg-secondary text-white" : "bg-white/5"}`}>Step {item}</span>
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-white">First, your birth moment.</h2>
                    <p className="mt-2 text-sm text-gray-400">Birth time helps calculate your hour pillar. If unknown, YiShun marks precision as lower.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="space-y-2 text-sm text-gray-300">
                      <span>Birth date</span>
                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        autoComplete="bday"
                        pattern="\d{4}-\d{2}-\d{2}"
                        placeholder="YYYY-MM-DD"
                        aria-describedby="birth-date-format"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="input-field"
                      />
                      <span id="birth-date-format" className="text-xs text-gray-500">Use YYYY-MM-DD, for example 1990-05-20.</span>
                    </label>
                    <label className="space-y-2 text-sm text-gray-300">
                      <span>Birth time</span>
                      <input
                        disabled={!birthTimeKnown}
                        type="text"
                        inputMode="numeric"
                        pattern="([01]\d|2[0-3]):[0-5]\d"
                        placeholder="HH:MM"
                        aria-describedby="birth-time-format"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="input-field disabled:opacity-50"
                      />
                      <span id="birth-time-format" className="text-xs text-gray-500">Use 24-hour time, for example 08:30.</span>
                    </label>
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
                    <input type="checkbox" checked={!birthTimeKnown} onChange={(e) => setBirthTimeKnown(!e.target.checked)} />
                    I’m not sure — use an estimated noon chart.
                  </label>
                  <button type="button" onClick={() => nextStep(2)} className="w-full rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white">Continue</button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-white">Where were you born?</h2>
                    <p className="mt-2 text-sm text-gray-400">We use location to adjust true solar time. You can continue with lower precision if you only know the city.</p>
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
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="rounded-2xl border border-white/20 px-5 py-4 text-sm text-gray-300">Back</button>
                    <button type="button" onClick={() => nextStep(3)} className="flex-1 rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white">Continue</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-white">What do you want help timing today?</h2>
                    <p className="mt-2 text-sm text-gray-400">This does not change your chart; it helps phrase today’s guidance.</p>
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
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)} className="rounded-2xl border border-white/20 px-5 py-4 text-sm text-gray-300">Back</button>
                    <button disabled={isSubmitting} className="flex-1 rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white shadow-lg disabled:opacity-60">
                      Reveal today’s signal
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
