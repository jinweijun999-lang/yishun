"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Background from "../components/Background";
import BirthDateTimePicker from "../components/BirthDateTimePicker";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AppBackLink from "../components/AppBackLink";
import PaymentValueMatrix from "../components/PaymentValueMatrix";
import StripeCheckoutButton from "../components/StripeCheckoutButton";
import { useI18n } from "../components/LocaleProvider";
import { logClientError } from "@/lib/error-logging";

type Profile = {
  email: string;
  birthDate: string | null;
  birthTime: string | null;
  gender: string | null;
  longitude: number | null;
  latitude: number | null;
  timezoneOffsetMinutes: number | null;
  timezoneName: string | null;
  consultationCredits: number;
  planTier: string | null;
  fullReportEntitlement?: { status: "locked" | "unlocked" | "pending"; source: string; note: string };
};

type Consultation = {
  id: string;
  question: string;
  createdAt: string;
  response: {
    interpretation: string;
    action_guidance?: {
      do: string;
      avoid: string;
    };
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const isEnglish = locale === "en";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState("other");
  const [longitude, setLongitude] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [timezoneOffsetMinutes, setTimezoneOffsetMinutes] = useState<string>("");
  const [timezoneName, setTimezoneName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [supportForm, setSupportForm] = useState({ category: "general", orderId: "", message: "" });
  const [supportResult, setSupportResult] = useState<{ id: string; status: string; nextStep: string } | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch("/api/profile?silent=1");
      const data = await response.json();
      if (data.authenticated === false) {
        router.push("/login?returnTo=/profile");
        return;
      }
      if (!response.ok) {
        router.push("/login");
        return;
      }
      setProfile(data.profile);
      setBirthDate(data.profile.birthDate ?? "");
      setBirthTime(data.profile.birthTime ?? "");
      setGender(data.profile.gender ?? "other");
      setLongitude(data.profile.longitude?.toString() ?? "");
      setLatitude(data.profile.latitude?.toString() ?? "");
      setTimezoneOffsetMinutes(
        data.profile.timezoneOffsetMinutes?.toString() ?? ""
      );
      setTimezoneName(data.profile.timezoneName ?? "");

      try {
        const res = await fetch("/api/consultations");
        if (res.ok) {
          const consultationsData = await res.json();
          setConsultations(consultationsData.consultations);
        }
      } catch (error) {
        console.error("Failed to load consultations", error);
      }
    };

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: birthDate || null,
          birthTime: birthTime || null,
          gender,
          longitude: longitude ? Number(longitude) : null,
          latitude: latitude ? Number(latitude) : null,
          timezoneOffsetMinutes: timezoneOffsetMinutes
            ? Number(timezoneOffsetMinutes)
            : null,
          timezoneName: timezoneName || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("errors.profileUpdateFailed"));
      }

      const data = await response.json();
      setProfile(data.profile);
      setSuccess(t("profile.updated"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("errors.profileUpdateFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator?.geolocation) {
      setError(t("profile.geoUnavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLongitude(position.coords.longitude.toFixed(4));
        setLatitude(position.coords.latitude.toFixed(4));
        setTimezoneOffsetMinutes(new Date().getTimezoneOffset().toString());
        setTimezoneName(Intl.DateTimeFormat().resolvedOptions().timeZone);
      },
      () => setError(t("profile.geoFailed"))
    );
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };



  const handleSupportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingSupport(true);
    setSupportResult(null);
    setError("");
    try {
      const response = await fetch("/api/support/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...supportForm, email: profile?.email ?? "", locale: "en" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Support submission failed");
      setSupportResult(data.ticket);
      setSuccess(`Support ticket created: ${data.ticket.id}`);
    } catch (err) {
      await logClientError({ route: "/profile#feedback-support", message: err instanceof Error ? err.message : "Support submission failed", code: "SUPPORT_CLIENT_FAILED" });
      setError(err instanceof Error ? err.message : "Support submission failed");
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  if (!profile) {
    return null;
  }

  // 双生肖相关逻辑回滚：不再在资料页显示会员标签

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen flex items-start justify-center px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl space-y-6"
        >
          <div className="glass card p-8 sm:p-10">
              <div className="mb-4">
                <AppBackLink label={t("common.goBack")} context="YiShun" />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-white text-glow">
                  {t("profile.title")}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-gray-400 text-sm">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <button
                  className="text-xs text-secondary hover:text-secondary/80"
                  onClick={handleLogout}
                >
                  {t("profile.logout")}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass card p-8 sm:p-10">
              <form onSubmit={handleSave} className="space-y-5">
                <BirthDateTimePicker
                  birthDate={birthDate}
                  birthTime={birthTime}
                  onBirthDateChange={setBirthDate}
                  onBirthTimeChange={setBirthTime}
                  birthDateLabel={t("register.birthDate") || "Birth date"}
                  birthTimeLabel={t("register.birthTime") || "Birth time"}
                  required
                />

                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="male">{t("fortuneForm.male")}</option>
                  <option value="female">{t("fortuneForm.female")}</option>
                  <option value="other">{t("fortuneForm.other")}</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder={t("profile.longitude")}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder={t("profile.latitude")}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={timezoneOffsetMinutes}
                    onChange={(e) => setTimezoneOffsetMinutes(e.target.value)}
                    placeholder={t("profile.timezoneOffset")}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={timezoneName}
                    onChange={(e) => setTimezoneName(e.target.value)}
                    placeholder={t("profile.timezoneName")}
                    className="input-field"
                  />
                </div>

                <button
                  type="button"
                  className="w-full bg-secondary/20 text-secondary py-2 rounded-xl hover:bg-secondary/30"
                  onClick={handleUseLocation}
                >
                  {t("profile.useLocation")}
                </button>

                {error && <p className="text-sm text-red-400">{error}</p>}
                {success && <p className="text-sm text-green-400">{success}</p>}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? t("profile.saving") : t("profile.save")}
                  </button>
                  <button
                    type="button"
                    className="w-full px-6 py-4 rounded-xl bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors"
                    onClick={() => router.push("/")}
                  >
                    {t("profile.backHome")}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <PaymentValueMatrix isEnglish={isEnglish} credits={profile.consultationCredits} compact source="profile" />

              <div className="glass card p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e0bd72]">Full Report entitlement</p>
                    <h2 className="mt-2 text-xl font-heading font-bold text-white">
                      {profile.fullReportEntitlement?.status === "unlocked" ? "Full Report unlocked" : "Free teaser only"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {profile.fullReportEntitlement?.note ?? "Full Report is separate from ask credits. Credits only power AI questions."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-2xl border border-[#e0bd72]/30 bg-[#e0bd72]/10 px-5 py-3 text-sm font-bold text-[#e0bd72]"
                    onClick={() => router.push(profile.fullReportEntitlement?.status === "unlocked" ? "/reading/result?source=profile_full_report" : "/reading/start?intent=full_report")}
                  >
                    {profile.fullReportEntitlement?.status === "unlocked" ? "View full report" : "Unlock full report"}
                  </button>
                </div>
              </div>

              <div className="glass card p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{t("profile.creditsLabel")}</p>
                    <p className="text-2xl font-heading font-bold text-white">
                      {profile.consultationCredits}
                    </p>
                  </div>
                  <div className="w-full sm:w-auto space-y-2">
                    <StripeCheckoutButton
                      product="consultation_single"
                      className="btn-primary w-full sm:w-auto"
                      fallbackLabel={isEnglish ? "Checkout is not configured. No credit was added." : "支付暂未配置，未增加次数。"}
                    >
                      {t("profile.buyCredit")}
                    </StripeCheckoutButton>
                    <p className="text-xs text-gray-500">
                      {t("singleConsultation.note")}
                    </p>
                  </div>
                </div>
              </div>

              <div id="feedback-support" className="glass card p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">Feedback / Support · 客服反馈</p>
                <h2 className="mt-2 text-xl font-heading font-bold text-white text-glow">
                  Help improve YiShun
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Report confusing readings, payment or order questions, and content issues. We will give you a tracking ID so follow-up is easier.
                </p>
                <form onSubmit={handleSupportSubmit} className="mt-5 grid gap-3">
                  <select
                    className="input-field"
                    value={supportForm.category}
                    onChange={(event) => setSupportForm((prev) => ({ ...prev, category: event.target.value }))}
                  >
                    <option value="general">General question</option>
                    <option value="reading_quality">Reading / copy quality</option>
                    <option value="order_payment">Order or payment problem</option>
                    <option value="bug_report">Bug / crash report</option>
                  </select>
                  <input
                    className="input-field"
                    value={supportForm.orderId}
                    onChange={(event) => setSupportForm((prev) => ({ ...prev, orderId: event.target.value }))}
                    placeholder="Order ID (optional for payment issues)"
                  />
                  <textarea
                    className="input-field min-h-[120px]"
                    value={supportForm.message}
                    onChange={(event) => setSupportForm((prev) => ({ ...prev, message: event.target.value }))}
                    placeholder="Tell us what happened. Please do not paste passwords, card numbers, or private secrets."
                    maxLength={1200}
                    required
                  />
                  <button className="btn-primary w-full sm:w-auto" disabled={isSubmittingSupport}>
                    {isSubmittingSupport ? "Submitting…" : "Submit feedback / 创建工单"}
                  </button>
                </form>
                {supportResult && (
                  <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">
                    <p className="font-bold">Tracking ID: {supportResult.id}</p>
                    <p className="mt-1">{supportResult.nextStep}</p>
                  </div>
                )}
                <a
                  className="mt-4 inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5"
                  href="mailto:support@yishun.app?subject=YiShun%20V1%20feedback"
                >
                  Email support@yishun.app
                </a>
              </div>

              <div className="glass card p-6 sm:p-8">
                <h2 className="text-xl font-heading font-bold text-white text-glow mb-4">
                  {t("profile.history")}
                </h2>

                {consultations.length === 0 ? (
                  <p className="text-gray-400 text-sm">{t("profile.history.empty")}</p>
                ) : (
                  <div className="space-y-3">
                    {consultations.map((c) => (
                      <div
                        key={c.id}
                        className="bg-surface/40 rounded-2xl p-5 border border-white/10 shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-white line-clamp-2">{c.question}</p>
                          </div>
                          <button
                            onClick={() => setSelectedConsultation(c)}
                            className="text-xs bg-secondary/20 text-secondary px-4 py-2 rounded-full hover:bg-secondary/30 transition-all duration-300 whitespace-nowrap"
                          >
                            {t("profile.history.view")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedConsultation && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedConsultation(null)}
            >
              <div
                className="bg-surface/90 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {t("profile.history.question")}
                  </h3>
                  <button
                    onClick={() => setSelectedConsultation(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-white mb-6 bg-surface/60 p-4 rounded-2xl">
                  {selectedConsultation.question}
                </p>

                <h3 className="text-lg font-bold text-white mb-2">
                  {t("layerC.section.interpretation")}
                </h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed whitespace-pre-wrap">
                  {selectedConsultation.response?.interpretation}
                </p>

                {selectedConsultation.response?.action_guidance && (
                  <div className="grid gap-4 sm:grid-cols-2 mb-4">
                    <div className="bg-secondary/10 p-4 rounded-2xl border border-secondary/30">
                      <span className="text-secondary text-xs font-bold uppercase block mb-1">
                        {t("layerC.action.do")}
                      </span>
                      <p className="text-gray-300 text-sm">
                        {selectedConsultation.response.action_guidance.do}
                      </p>
                    </div>
                    <div className="bg-accent/10 p-4 rounded-2xl border border-accent/30">
                      <span className="text-accent text-xs font-bold uppercase block mb-1">
                        {t("layerC.action.avoid")}
                      </span>
                      <p className="text-gray-300 text-sm">
                        {selectedConsultation.response.action_guidance.avoid}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedConsultation(null)}
                  className="w-full mt-4 bg-white/10 text-white py-2 rounded hover:bg-white/20"
                >
                  {t("profile.history.close")}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </>
  );
}
