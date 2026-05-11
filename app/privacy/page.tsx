import type { Metadata } from "next";
import Link from "next/link";
import Background from "../components/Background";

export const metadata: Metadata = {
  title: "Privacy Policy | YiShun",
  description: "YiShun privacy policy for web, PWA, Android lightweight app, and iOS app shells.",
};

export default function PrivacyPage() {
  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 py-10 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-surface/75 p-6 text-gray-300 shadow-2xl sm:p-8">
          <Link href="/" className="text-sm text-secondary hover:text-secondary/80">← Back to YiShun</Link>
          <p className="mt-8 text-xs uppercase tracking-[0.28em] text-accent/80">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-heading font-bold text-white">YiShun Privacy Policy</h1>
          <p className="mt-4 text-sm leading-6">
            P0 notice for web/PWA/App shell testing. YiShun uses birth date, optional birth time, location text, coordinates,
            timezone, locale, and funnel events only to generate astrology-style self-reflection content and improve the product.
          </p>
          <section className="mt-6 space-y-4 text-sm leading-6">
            <h2 className="text-xl font-heading font-semibold text-white">Data we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Birth profile fields entered by you: date, known/unknown time, place text, latitude/longitude, timezone, and optional gender.</li>
              <li>Account fields if you register: email, plan tier, and saved reading metadata.</li>
              <li>Basic analytics events such as landing, birth form completion, result view, ad unlock mock, share, and paywall click.</li>
            </ul>
            <h2 className="text-xl font-heading font-semibold text-white">What P0 does not do</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>No production Stripe, Apple IAP, Google Play Billing, AdMob, or third-party ad SDK is active in this repo state.</li>
              <li>No medical, financial, legal, or life-critical decision service is provided.</li>
              <li>No precise location permission is requested by the P0 web flow; users manually enter location details.</li>
            </ul>
            <h2 className="text-xl font-heading font-semibold text-white">Deletion and contact</h2>
            <p>
              Before production launch, add a verified support mailbox and self-serve deletion flow at <code className="rounded bg-black/30 px-1">/account/delete</code>.
              Until then, this page is a compliance placeholder for internal staging and app-shell planning.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
