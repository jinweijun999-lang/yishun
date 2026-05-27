import type { Metadata } from "next";
import Background from "../components/Background";
import AppBackLink from "../components/AppBackLink";

export const metadata: Metadata = {
  title: "Privacy Policy | YiShun",
  description: "YiShun privacy policy for web and mobile experiences.",
};

export default function PrivacyPage() {
  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 py-10 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-surface/75 p-6 text-gray-300 shadow-2xl sm:p-8">
          <AppBackLink href="/" label="Back to YiShun" context="Legal" />
          <p className="mt-8 text-xs uppercase tracking-[0.28em] text-accent/80">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-heading font-bold text-white">YiShun Privacy Policy</h1>
          <p className="mt-4 text-sm leading-6">
            YiShun uses birth date, optional birth time, location text, coordinates, timezone, locale, and product events
            only to generate astrology-style self-reflection content, keep your reading experience working, and improve the product.
          </p>
          <section className="mt-6 space-y-4 text-sm leading-6">
            <h2 className="text-xl font-heading font-semibold text-white">Data we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Birth profile fields entered by you: date, known/unknown time, place text, latitude/longitude, timezone, and optional gender.</li>
              <li>Account fields if you register: email, plan tier, and saved reading metadata.</li>
              <li>Basic analytics events such as landing, birth form completion, result view, share, checkout start, and paywall click.</li>
            </ul>
            <h2 className="text-xl font-heading font-semibold text-white">What YiShun does not do</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>YiShun does not sell your birth profile or payment details.</li>
              <li>No medical, financial, legal, or life-critical decision service is provided.</li>
              <li>No precise location permission is required for the core web flow; you can enter location details manually.</li>
            </ul>
            <h2 className="text-xl font-heading font-semibold text-white">Deletion and contact</h2>
            <p>
              You can request account and saved reading deletion at <code className="rounded bg-black/30 px-1">/account/delete</code>
              or email <a className="text-accent hover:text-white" href="mailto:support@yishun.app">support@yishun.app</a>.
              We will verify the request before removing account records, saved birth profiles, and saved reports where technically possible.
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
