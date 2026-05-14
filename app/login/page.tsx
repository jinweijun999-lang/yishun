"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Background from "../components/Background";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AppBackLink from "../components/AppBackLink";
import { useI18n } from "../components/LocaleProvider";

export default function LoginPage() {
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("errors.loginFailed"));
      }

      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.loginFailed"));
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
              <AppBackLink label={t("common.goBack")} context="YiShun" />
              <div>
                <h1 className="text-3xl font-heading font-bold text-white mb-2 text-glow">
                  {t("login.title")}
                </h1>
                <p className="text-gray-400 text-sm">
                  {t("login.subtitle")}
                </p>
              </div>
              <LanguageSwitcher />
            </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.email")}
              required
              className="input-field"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.password")}
              required
              className="input-field"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-sm text-gray-400">
            {t("login.newHere")}{" "}
            <button
              className="text-secondary hover:text-secondary/80"
              onClick={() =>
                router.push(`/register?returnTo=${encodeURIComponent(returnTo)}`)
              }
            >
              {t("login.createAccount")}
            </button>
          </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
