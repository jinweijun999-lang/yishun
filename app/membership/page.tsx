"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Background from "../components/Background";
import Navigation from "../components/Navigation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useI18n } from "../components/LocaleProvider";
import StripeCheckoutButton, { type StripeCheckoutProduct } from "../components/StripeCheckoutButton";

type ProfileData = {
  email: string;
  planTier?: string | null;
  consultationCredits?: number | null;
};

type MembershipTier = {
  id: string;
  icon: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlight: boolean;
  disabled?: boolean;
  checkoutProduct?: StripeCheckoutProduct;
};

export default function MembershipPage() {
  const router = useRouter();
  const handleBack = () => { router.back(); };
  const { t, locale } = useI18n();
  const isEnglish = locale === "en";
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
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

  const handleBuyCredit = async () => {
    setIsBuying(true);
    setBuySuccess("");
    try {
      const response = await fetch("/api/credits", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setProfile((prev) =>
          prev ? { ...prev, consultationCredits: data.consultationCredits } : prev
        );
        setBuySuccess(t("profile.creditPurchased"));
      }
    } catch (error) {
      console.error("Failed to buy credit", error);
    } finally {
      setIsBuying(false);
    }
  };

  const tiers: MembershipTier[] = [
    {
      id: "free",
      icon: "🌱",
      name: t("membership.tier.free"),
      price: "$0",
      period: "",
      description: isEnglish ? "Best for trying your first Daily Ritual." : "适合初步了解",
      features: isEnglish
        ? [
            "Daily Ritual signal with rewarded access",
            "One free birth-chart preview",
            "Basic Five Elements analysis",
            "Single consultation available at $2.99",
          ]
        : [
            "每日运势信号（需观看广告）",
            "一次免费排盘",
            "基础五行分析",
            "单次咨询 $2.99/次",
          ],
      cta: t("nav.register"),
      ctaHref: "/register",
      highlight: false,
    },
    {
      id: "monthly",
      icon: "🌙",
      name: t("membership.tier.monthly"),
      price: "$9.99",
      period: isEnglish ? "/month" : "/月",
      description: isEnglish ? "Best for ongoing weekly reflection." : "适合持续使用",
      features: isEnglish
        ? [
            "Daily Ritual signal without rewarded access",
            "Unlimited birth-chart previews",
            "Complete Ten Gods profile",
            "10 structured interpretations per month",
            "Priority support",
          ]
        : [
            "每日运势信号（无需广告）",
            "无限排盘",
            "完整十神图谱",
            "每月 10 次结构化解读",
            "优先客服支持",
          ],
      cta: isEnglish ? "Continue to checkout" : "测试结账",
      ctaHref: "#",
      highlight: false,
      disabled: false,
      checkoutProduct: "premium_monthly",
    },
    {
      id: "annual",
      icon: "⭐",
      name: t("membership.tier.annual"),
      price: "$79.99",
      period: isEnglish ? "/year" : "/年",
      description: t("membership.tier.annualValue"),
      features: isEnglish
        ? [
            "Everything in Monthly Member",
            "Daily Ritual signal without rewarded access",
            "Unlimited structured interpretations",
            "Full history retention",
            "Priority support",
          ]
        : [
            "Monthly Member 全部权益",
            "每日运势信号（无需广告）",
            "无限次结构化解读",
            "历史记录完整保存",
            "优先客服支持",
          ],
      cta: isEnglish ? "Coming soon" : "即将推出",
      ctaHref: "#",
      highlight: true,
      disabled: true,
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
                aria-label={t("common.goBack")}
              >
                ←
              </button>
              <span className="text-xl" role="img" aria-hidden="true">🔮</span>
              <h1 className="text-lg font-heading font-bold text-white">
                {isEnglish ? "YiShun" : <>YiShun <span className="text-accent text-sm">易顺</span></>}
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
              {t("nav.tab.membership")}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {isEnglish ? "Unlock deeper Daily Ritual guidance when you are ready." : "开启你的专业命理之旅"}
            </p>
          </motion.div>

          {/* Current Plan Status */}
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass card px-4 py-3 flex items-center justify-between"
            >
              <span className="text-xs text-gray-400">
                {t("nav.signedInAs", { email: profile.email ?? "" })}
              </span>
              {profile.planTier && profile.planTier !== "free" ? (
                <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-secondary text-xs">
                  {profile.planTier}
                </span>
              ) : (
                <span className="rounded-full border border-gray-600/30 bg-gray-600/10 px-2 py-0.5 text-gray-400 text-xs">
                  Free Member
                </span>
              )}
            </motion.div>
          )}

          {/* Consultation Credits Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass card p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  {t("layerC.price")}
                </p>
                <p className="text-3xl font-heading font-bold text-white">
                  {t("singleConsultation.note").split("\n")[0]}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {profile?.consultationCredits !== undefined
                    ? `${t("layerC.status.paid", { count: profile.consultationCredits ?? 0 })}`
                    : t("layerC.status.free")}
                </p>
              </div>
              <div className="space-y-2">
                <StripeCheckoutButton
                  product="consultation_single"
                  className="w-full px-6 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm hover:bg-secondary transition-colors"
                >
                  Continue to checkout $2.99
                </StripeCheckoutButton>
                <button
                  onClick={handleBuyCredit}
                  disabled={isBuying}
                  className="w-full px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {isBuying ? t("profile.buying") : t("profile.buyCredit")}
                </button>
              </div>
            </div>
            {buySuccess && (
              <p className="text-sm text-green-400 mt-3">{buySuccess}</p>
            )}
          </motion.div>

          {/* Membership Tiers */}
          <div className="space-y-4">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
              >
                <div
                  className={`glass card p-5 ${
                    tier.highlight
                      ? "border-secondary/40 bg-gradient-to-br from-secondary/5 to-transparent"
                      : ""
                  } ${tier.disabled ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl" role="img" aria-hidden="true">
                        {tier.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-heading font-bold text-white">
                          {tier.name}
                        </h3>
                        {tier.highlight && (
                          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-secondary text-xs">
                            {isEnglish ? "Best value" : "推荐"}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-heading font-bold text-white mt-1">
                        {tier.price}
                        <span className="text-sm text-gray-500 font-normal">{tier.period}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{tier.description}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-secondary flex-shrink-0">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {tier.checkoutProduct ? (
                    <StripeCheckoutButton
                      product={tier.checkoutProduct}
                      disabled={tier.disabled}
                      className={`block w-full text-center px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                        tier.highlight
                          ? "bg-secondary/80 text-white hover:bg-secondary"
                          : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {tier.cta}
                    </StripeCheckoutButton>
                  ) : (
                    <a
                      href={tier.ctaHref}
                      className={`block w-full text-center px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                        tier.highlight
                          ? "bg-secondary/80 text-white hover:bg-secondary"
                          : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                      } ${tier.disabled ? "pointer-events-none" : ""}`}
                    >
                      {tier.cta}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4"
          >
            <p className="text-xs text-gray-600">
              {t("common.poweredBy")}
            </p>
            <p className="text-xs text-gray-700 mt-1">
              {t("common.disclaimer")}
            </p>
          </motion.div>
        </div>

        <Navigation />
      </main>
    </>
  );
}
