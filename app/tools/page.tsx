"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Background from "../components/Background";
import Navigation from "../components/Navigation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useI18n } from "../components/LocaleProvider";

type ProfileData = {
  email: string;
  birthDate: string | null;
  birthTime: string | null;
  gender: string | null;
  planTier?: string | null;
  consultationCredits?: number | null;
};

function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((item) => item.startsWith("fortune_session="));
}

export default function ToolsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!hasSessionCookie()) return;
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    loadProfile();
  }, []);

  const isLoggedIn = !!profile;
  const hasCompleteProfile = !!(profile?.birthDate && profile?.birthTime && profile?.gender);
  const handleBack = () => { router.back(); };

  const tools = [
    {
      id: "divination",
      icon: "🔮",
      title: t("quickDivination.title"),
      description: t("quickDivination.description"),
      href: isLoggedIn ? "/" : "/login",
      cta: t("quickDivination.startBtn"),
      color: "from-secondary/20 to-accent/10",
      borderColor: "border-secondary/20",
      available: true,
    },
    {
      id: "bazi-chart",
      icon: "📊",
      title: t("baziChart.title"),
      description: t("baziChart.subtitle"),
      href: "/tools/sample",
      cta: t("quickDivination.trySample"),
      color: "from-accent/20 to-primary/10",
      borderColor: "border-accent/20",
      available: isLoggedIn && hasCompleteProfile,
      locked: !isLoggedIn || !hasCompleteProfile,
      lockedMsg: isLoggedIn ? t("errors.profileIncomplete") : t("auth.requireTitle"),
    },
    {
      id: "five-elements",
      icon: "🟢",
      title: t("fiveElements.title"),
      description: t("fiveElements.analysis"),
      href: "/tools/sample",
      cta: t("quickDivination.trySample"),
      color: "from-green-500/20 to-emerald-500/10",
      borderColor: "border-green-500/20",
      available: isLoggedIn && hasCompleteProfile,
      locked: !isLoggedIn || !hasCompleteProfile,
    },
    {
      id: "ten-gods",
      icon: "⚡",
      title: t("tenGods.title"),
      description: t("tenGods.lockedDesc"),
      href: "/membership",
      cta: t("tenGods.unlockBtn"),
      color: "from-yellow-500/20 to-orange-500/10",
      borderColor: "border-yellow-500/20",
      available: profile?.planTier !== "free",
      locked: profile?.planTier === "free",
    },
    {
      id: "consultation",
      icon: "💬",
      title: t("layerC.title"),
      description: t("layerC.notice"),
      href: isLoggedIn && (profile?.consultationCredits ?? 0) > 0 ? "/" : "/membership",
      cta: (profile?.consultationCredits ?? 0) > 0 ? t("layerC.askQuestion") : t("layerC.buyMore"),
      color: "from-blue-500/20 to-indigo-500/10",
      borderColor: "border-blue-500/20",
      available: isLoggedIn && (profile?.consultationCredits ?? 0) > 0,
      locked: !isLoggedIn || (profile?.consultationCredits ?? 0) === 0,
      credits: profile?.consultationCredits ?? 0,
    },
  ];

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="返回"
              >
                ←
              </button>
              <span className="text-xl" role="img" aria-hidden="true">🔮</span>
              <h1 className="text-lg font-heading font-bold text-white">
                YiShun <span className="text-accent text-sm">易顺</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <h2 className="text-2xl font-heading font-bold text-white text-glow">
              {t("nav.tab.tools")}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {t("headerIdentity.subtitle")}
            </p>
          </motion.div>

          {/* User Status */}
          {isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass card px-4 py-3 flex items-center justify-between"
            >
              <span className="text-xs text-gray-400">{t("nav.signedInAs", { email: profile.email })}</span>
              {profile.planTier && profile.planTier !== "free" && (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent text-xs">
                  {profile.planTier}
                </span>
              )}
            </motion.div>
          )}

          {/* Tools Grid */}
          <div className="grid gap-4">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div
                  className={`glass card p-5 bg-gradient-to-br ${tool.color} border ${tool.borderColor} hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl" role="img" aria-hidden="true">
                        {tool.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-heading font-bold text-white mb-1">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {tool.description}
                      </p>
                      {tool.locked && (
                        <p className="text-xs text-accent/70 mt-1">
                          🔒 {tool.lockedMsg || t("tenGods.lockedDesc")}
                        </p>
                      )}
                      {tool.id === "consultation" && tool.available && (
                        <p className="text-xs text-secondary mt-1">
                          {t("layerC.status.paid", { count: tool.credits ?? 0 })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    {tool.locked ? (
                      <a
                        href={tool.href}
                        className="px-4 py-2 rounded-xl border border-white/20 text-gray-300 text-xs hover:bg-white/5 transition-colors"
                      >
                        {tool.cta}
                      </a>
                    ) : (
                      <a
                        href={tool.href}
                        className="px-4 py-2 rounded-xl bg-secondary/80 text-white font-semibold text-xs hover:bg-secondary transition-colors"
                      >
                        {tool.cta}
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4"
          >
            <p className="text-xs text-gray-600">
              🔮 {t("common.poweredBy")}
            </p>
          </motion.div>
        </div>

        <Navigation />
      </main>
    </>
  );
}
