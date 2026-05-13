"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Background from "../components/Background";
import BirthDateTimePicker from "../components/BirthDateTimePicker";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useI18n } from "../components/LocaleProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const returnToParam = searchParams.get("returnTo");
  const returnTo =
    returnToParam && returnToParam.startsWith("/") && !returnToParam.startsWith("//")
      ? returnToParam
      : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState("other");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, birthDate, birthTime, gender }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("errors.registerFailed"));
      }

      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.registerFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-3xl space-y-6">
          <div className="glass card p-8 sm:p-10 space-y-3">
            <h2 className="text-3xl font-heading font-bold text-white text-glow">
              {t("headerIdentity.title")}
            </h2>
            <p className="text-sm text-gray-300">{t("headerIdentity.subtitle")}</p>
            <p className="text-xs text-gray-500">{t("headerIdentity.note")}</p>
            <p className="text-xs text-gray-500">{t("common.disclaimer")}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full glass card p-8 sm:p-10 space-y-6"
          >
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"
                aria-label="返回"
              >
                ←
              </button>
              <div>
                <h1 className="text-3xl font-heading font-bold text-white mb-2 text-glow">
                  {t("register.title")}
                </h1>
                <p className="text-gray-400 text-sm">
                  {t("register.subtitle")}
                </p>
              </div>
              <LanguageSwitcher />
            </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("register.email")}
              required
              className="input-field"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("register.password")}
              required
              className="input-field"
            />
            <BirthDateTimePicker
              birthDate={birthDate}
              birthTime={birthTime}
              onBirthDateChange={setBirthDate}
              onBirthTimeChange={setBirthTime}
              birthDateLabel={t("register.birthDate") || "出生日期"}
              birthTimeLabel={t("register.birthTime") || "出生时辰"}
              required
            />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className="input-field"
            >
              <option value="male">{t("register.male")}</option>
              <option value="female">{t("register.female")}</option>
              <option value="other">{t("register.other")}</option>
            </select>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading ? t("register.creating") : t("register.createAccount")}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-sm text-gray-400">
            {t("register.already")}{" "}
            <button
              className="text-secondary hover:text-secondary/80"
              onClick={() =>
                router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`)
              }
            >
              {t("register.signIn")}
            </button>
          </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
