import type { Metadata } from "next";
import Background from "../components/Background";
import AppBackLink from "../components/AppBackLink";

export const metadata: Metadata = {
  title: "Terms & Disclaimer | YiShun",
  description: "YiShun entertainment-only terms and astrology disclaimer for web, PWA, Android, and iOS.",
};

export default function TermsPage() {
  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 py-10 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-surface/75 p-6 text-gray-300 shadow-2xl sm:p-8">
          <AppBackLink href="/" label="Back to YiShun" context="Legal" />
          <p className="mt-8 text-xs uppercase tracking-[0.28em] text-accent/80">Terms & Disclaimer</p>
          <h1 className="mt-3 text-3xl font-heading font-bold text-white">Built for reflection, not fear.</h1>
          <section className="mt-6 space-y-4 text-sm leading-6">
            <p>
              YiShun provides Eastern astrology, BaZi, Five Elements, daily timing, and compatibility-style content for
              entertainment, journaling, and self-reflection only.
            </p>
            <h2 className="text-xl font-heading font-semibold text-white">No professional advice</h2>
            <p>
              YiShun does not provide medical, financial, legal, investment, psychological, safety, or life-critical advice.
              Do not use YiShun as the only basis for decisions about health, money, law, relationships, travel, or safety.
            </p>
            <h2 className="text-xl font-heading font-semibold text-white">No deterministic claims</h2>
            <p>
              Scores, lucky directions, timing windows, compatibility notes, and report language are probabilistic-style
              reflective prompts. They are not guarantees, predictions of unavoidable events, or instructions you must follow.
            </p>
            <h2 className="text-xl font-heading font-semibold text-white">App payment boundary</h2>
            <p>
              P0 keeps paid reports, subscriptions, rewarded ads, Stripe, Apple IAP, Google Play Billing, and ad SDKs in mock
              or planning state. iOS digital content must use Apple In-App Purchase before public App Store submission.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
