import type { Metadata } from "next";
import Background from "../../components/Background";
import AppBackLink from "../../components/AppBackLink";

export const metadata: Metadata = {
  title: "Delete Account | YiShun",
  description: "Request deletion of your YiShun account, birth profile, and saved reading data.",
};

export default function DeleteAccountPage() {
  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen px-4 py-10 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-surface/75 p-6 text-gray-300 shadow-2xl sm:p-8">
          <AppBackLink href="/privacy" label="Privacy Policy" context="Back" />
          <p className="mt-8 text-xs uppercase tracking-[0.28em] text-accent/80">Data deletion</p>
          <h1 className="mt-3 text-3xl font-heading font-bold text-white">Request account deletion</h1>
          <p className="mt-4 text-sm leading-6">
            Email <a className="text-accent hover:text-white" href="mailto:support@yishun.app?subject=YiShun%20account%20deletion">support@yishun.app</a>
            from your account email to request deletion. We will verify ownership and remove account records, saved birth profiles,
            saved reports, and analytics identifiers where technically possible.
          </p>
        </section>
      </main>
    </>
  );
}
