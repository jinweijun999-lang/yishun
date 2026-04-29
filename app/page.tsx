"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Background from "./components/Background";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Navigation from "./components/Navigation";
import TodayFortune from "./components/TodayFortune";
import QuickDivination from "./components/QuickDivination";
import { useI18n } from "./components/LocaleProvider";

type ProfileData = {
  email: string;
  birthDate: string | null;
  birthTime: string | null;
  gender: string | null;
  planTier?: string | null;
  consultationCredits?: number | null;
};

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }
      } finally {
        setAuthChecked(true);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setProfile(null);
    setAuthChecked(false);
  };

  const isLoggedIn = !!profile;
  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl" role="img" aria-hidden="true">🔮</span>
              <h1 className="text-lg font-heading font-bold text-white">
                YiShun <span className="text-accent text-sm">易顺</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {isLoggedIn ? (
                <a
                  href="/profile"
                  className="text-xs text-secondary hover:text-secondary/80 transition-colors"
                >
                  {t("nav.profile")}
                </a>
              ) : (
                <a
                  href="/login"
                  className="text-xs text-secondary hover:text-secondary/80 transition-colors"
                >
                  {t("nav.login")}
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* User Status Bar */}
          {isLoggedIn && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{t("nav.signedInAs", { email: profile.email })}</span>
              {profile.planTier && profile.planTier !== "free" && (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent">
                  {profile.planTier}
                </span>
              )}
            </div>
          )}

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <h2 className="text-2xl font-heading font-bold text-white text-glow">
              {t("headerIdentity.title")}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {t("headerIdentity.subtitle")}
            </p>
          </motion.div>

          {/* Today Fortune Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TodayFortune
              date={today}
              dayTip={t("todayFortune.defaultTip")}
              overallScore={78}
            />
          </motion.div>

          {/* Quick Divination Entry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <QuickDivination isLoggedIn={isLoggedIn} />
          </motion.div>

          {/* Featured Content / Knowledge Bite */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-surface/60 border border-white/10 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg" role="img" aria-hidden="true">📚</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-accent/80 mb-1">
                  命理小知识
                </p>
                <h3 className="text-base font-heading font-bold text-white">
                  什么是四柱八字？
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  四柱八字是中国传统命理学的核心体系，以年、月、日、时四柱为基础，
                  结合天干地支的五行生克关系，分析一个人的命运走势与性格特征。
                </p>
                <a
                  href="/learn/bazi-basics"
                  className="inline-block mt-3 text-xs text-secondary hover:text-secondary/80 transition-colors"
                >
                  了解更多 →
                </a>
              </div>
            </div>
          </motion.div>

          {/* Membership Banner */}
          {!isLoggedIn || profile?.planTier === "free" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-gradient-to-br from-secondary/10 via-surface/80 to-accent/5 border border-secondary/20 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/30 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl" role="img" aria-hidden="true">💎</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-accent/80 mb-1">
                    {profile?.planTier === "free" ? "升级会员" : "解锁全部功能"}
                  </p>
                  <h3 className="text-base font-heading font-bold text-white">
                    {profile?.planTier === "free"
                      ? "升级以解锁完整命盘"
                      : "开启你的专业命理之旅"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {profile?.planTier === "free"
                      ? "查看十神图谱、五行分析、深度解读"
                      : "注册即享免费排盘一次"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                {profile?.planTier === "free" ? (
                  <a
                    href="/membership"
                    className="flex-1 px-4 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm text-center hover:bg-secondary transition-colors"
                  >
                    立即升级
                  </a>
                ) : (
                  <a
                    href="/register"
                    className="flex-1 px-4 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm text-center hover:bg-secondary transition-colors"
                  >
                    免费注册
                  </a>
                )}
                <a
                  href="/learn"
                  className="px-4 py-3 rounded-xl border border-white/20 text-gray-300 text-sm hover:bg-white/5 transition-colors"
                >
                  了解更多
                </a>
              </div>
            </motion.div>
          ) : null}

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4"
          >
            <p className="text-xs text-gray-600">
              🔮 {t("common.poweredBy")}
            </p>
            <p className="text-xs text-gray-700 mt-1">
              {t("common.disclaimer")}
            </p>
          </motion.div>
        </div>

        {/* Bottom Navigation */}
        <Navigation />
      </main>
    </>
  );
}
