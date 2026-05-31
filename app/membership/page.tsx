"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Background from "../components/Background";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AppBackLink from "../components/AppBackLink";
import YiShunBottomActionBar from "../components/YiShunBottomActionBar";
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

function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((item) => item.startsWith("fortune_session="));
}

export default function MembershipPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const isEnglish = locale === "en";
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState("");

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

  const requireAuthHref = `/login?returnTo=${encodeURIComponent("/membership")}`;



  const tiers: MembershipTier[] = [
    {
      id: "free",
      icon: "🌱",
      name: t("membership.tier.free"),
      price: "$0",
      period: "",
      description: t("membership.free.description"),
      features: [
        t("membership.free.feature1"),
        t("membership.free.feature2"),
        t("membership.free.feature3"),
        t("membership.free.feature4"),
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
      description: t("membership.monthly.description"),
      features: [
        t("membership.monthly.feature1"),
        t("membership.monthly.feature2"),
        t("membership.monthly.feature3"),
        t("membership.monthly.feature4"),
        t("membership.monthly.feature5"),
      ],
      cta: t("membership.checkout"),
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
      features: [
        t("membership.annual.feature1"),
        t("membership.annual.feature2"),
        t("membership.annual.feature3"),
        t("membership.annual.feature4"),
        t("membership.annual.feature5"),
      ],
      cta: t("membership.checkout"),
      ctaHref: "#",
      highlight: true,
      disabled: false,
      checkoutProduct: "premium_annual",
    },
  ];

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-32 md:pb-16">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AppBackLink label={t("common.goBack")} context={isEnglish ? "Membership" : "会员"} icon="‹" />
              <h1 className="hidden text-lg font-heading font-bold text-white sm:block">
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
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-secondary">
              YiShun
            </p>
            <h2 className="text-2xl font-heading font-bold text-white text-glow">
              {t("nav.tab.membership")}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {t("membership.subtitle")}
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
                  {t("membership.tier.free")}
                </span>
              )}
            </motion.div>
          )}

          {!profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass card border border-secondary/25 bg-secondary/10 px-4 py-4"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                {isEnglish ? "View benefits first · purchase after sign-in" : "可先查看权益 · 登录后才能购买"}
              </p>
              <h2 className="mt-2 text-lg font-heading font-bold text-white">
                {isEnglish ? "You can compare plans here. Checkout is locked until you sign in." : "这里可以先对比权益；购买按钮必须登录后才会进入结账。"}
              </h2>
              <p className="mt-2 text-xs leading-5 text-gray-400">
                {isEnglish
                  ? "No credits or membership benefits are granted from this page without checkout fulfillment. Signing in only identifies the purchase account."
                  : "未完成结账履约不会增加次数或开通会员；登录只是用于确认购买账号。"}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <a href="#monthly-plan" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white">
                  {isEnglish ? "View benefits" : "查看权益"}
                </a>
                <a href={requireAuthHref} className="rounded-xl bg-secondary/80 px-4 py-3 text-center text-sm font-bold text-white hover:bg-secondary">
                  {isEnglish ? "Sign in to purchase" : "登录后购买"}
                </a>
              </div>
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
                {profile ? (
                  <StripeCheckoutButton
                    product="consultation_single"
                    className="w-full px-6 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm hover:bg-secondary transition-colors"
                  >
                    {t("membership.singleCheckout")}
                  </StripeCheckoutButton>
                ) : (
                  <a href={requireAuthHref} className="block w-full px-6 py-3 rounded-xl bg-secondary/80 text-center text-white font-semibold text-sm hover:bg-secondary transition-colors">
                    {isEnglish ? "Sign in to buy Ask Credit" : "登录后购买问事次数"}
                  </a>
                )}
                <p className="max-w-xs text-xs leading-5 text-gray-500">
                  {isEnglish ? "Single-credit purchases always open checkout first; credits are added only after payment fulfillment." : "单次购买必须先进入支付；只有支付履约后才增加次数。"}
                </p>
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
                  id={tier.id === "monthly" ? "monthly-plan" : undefined}
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
                            {t("membership.bestValue")}
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
                    profile ? (
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
                        href={requireAuthHref}
                        className={`block w-full text-center px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                          tier.highlight
                            ? "bg-secondary/80 text-white hover:bg-secondary"
                            : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {isEnglish ? "Sign in to purchase" : "登录后购买"}
                      </a>
                    )
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

        <YiShunBottomActionBar
          statusText={isEnglish ? "Secure Stripe checkout. Purchases can be restored after sign-in." : "安全支付；登录后可恢复购买。"}
          primary={{
            label: isEnglish ? "Continue membership" : "继续开通",
            icon: "◈",
            onClick: () => {
              setIsBuying(true);
              if (!profile) router.push(requireAuthHref);
              else document.getElementById("monthly-plan")?.scrollIntoView({ behavior: "smooth", block: "center" });
              window.setTimeout(() => setIsBuying(false), 900);
            },
            state: isBuying ? "loading" : "default",
            loadingLabel: isEnglish ? "Opening..." : "正在跳转...",
          }}
          secondary={{
            label: isEnglish ? "Restore" : "恢复购买",
            icon: "↻",
            onClick: () => setBuySuccess(isEnglish ? "Sign in with the purchase account to restore access." : "请使用购买账号登录后恢复权益。"),
            state: buySuccess ? "success" : "default",
            successLabel: isEnglish ? "Notice shown" : "已提示",
          }}
          tertiary={{
            label: isEnglish ? "Benefits" : "权益说明",
            icon: "i",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          }}
        />
      </main>
    </>
  );
}
