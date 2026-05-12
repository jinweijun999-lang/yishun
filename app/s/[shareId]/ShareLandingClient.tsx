"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { queueP0Analytics } from "@/lib/p0-analytics";
import type { PublicSharePayload } from "@/lib/share-links";

type ShareLandingClientProps = {
  shareId: string;
  payload: PublicSharePayload | null;
  status: "ready" | "missing" | "expired";
  createdAt?: string;
};

function deviceType() {
  if (typeof window === "undefined") return "unknown";
  return window.matchMedia("(max-width: 640px)").matches ? "mobile" : "desktop";
}

export default function ShareLandingClient({ shareId, payload, status, createdAt }: ShareLandingClientProps) {
  const target = `/reading/start?ref=share&share_id=${encodeURIComponent(shareId)}`;
  const enteredAtRef = useRef<number>(0);
  const maxScrollDepthRef = useRef<number>(0);
  const ctaClickedRef = useRef(false);
  const exitTrackedRef = useRef(false);

  useEffect(() => {
    queueP0Analytics("share_landing_view", {
      share_id: shareId,
      referrer: document.referrer || "direct",
      utm_source: new URLSearchParams(window.location.search).get("utm_source") ?? "share_link",
      device_type: deviceType(),
      status,
    });
  }, [shareId, status]);

  useEffect(() => {
    enteredAtRef.current = Date.now();

    function updateScrollDepth() {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = scrollableHeight <= 0 ? 100 : Math.round((window.scrollY / scrollableHeight) * 100);
      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, Math.min(100, Math.max(0, scrollDepth)));
    }

    function trackExit() {
      if (ctaClickedRef.current || exitTrackedRef.current) return;
      exitTrackedRef.current = true;
      updateScrollDepth();
      queueP0Analytics("share_landing_exit", {
        share_id: shareId,
        dwell_ms: Math.max(0, Date.now() - (enteredAtRef.current || Date.now())),
        scroll_depth: maxScrollDepthRef.current,
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") trackExit();
    }

    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", trackExit);

    return () => {
      window.removeEventListener("scroll", updateScrollDepth);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", trackExit);
    };
  }, [shareId]);

  async function handleCtaClick(ctaType: "generate_my_card" | "open_app") {
    ctaClickedRef.current = true;
    const properties = { share_id: shareId, cta_type: ctaType, device_type: deviceType(), locale: navigator.language || "en" };
    queueP0Analytics("share_landing_cta_click", properties);
    queueP0Analytics("shared_user_generate_started", { share_id: shareId, entry_screen: "share_landing", locale: properties.locale });
    await fetch(`/api/v1/shares/${encodeURIComponent(shareId)}/cta`, { method: "POST" }).catch(() => undefined);
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5 text-white sm:max-w-2xl sm:py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-heading text-lg font-bold tracking-wide text-white">YiShun</Link>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-accent">Shared insight</span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-5 py-8">
        <div className="rounded-[2rem] border border-secondary/25 bg-gradient-to-br from-secondary/20 via-surface/85 to-accent/15 p-5 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.26em] text-secondary">A friend shared a YiShun insight with you</p>
          <h1 className="mt-4 text-3xl font-heading font-bold leading-tight text-glow sm:text-4xl">
            {payload?.title ?? (status === "expired" ? "This YiShun card has expired" : "Create your own timing card")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            {payload?.summary ?? "The shared snapshot is not available now, but you can still generate your own daily timing card in about 60 seconds."}
          </p>
          {createdAt && <p className="mt-3 text-xs text-gray-500">Shared {new Date(createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>}
        </div>

        <article className="rounded-[2rem] border border-white/15 bg-black/30 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur" aria-label="Public share preview card">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">YiShun Timing Card</p>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{payload?.theme ?? "Daily"}</span>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-gray-200">
            {payload?.score_label && <p><span className="text-secondary">Clarity:</span> {payload.score_label}</p>}
            {payload?.best_window && <p><span className="text-secondary">Best:</span> {payload.best_window}</p>}
            {payload?.avoid_window && <p><span className="text-accent">Avoid:</span> {payload.avoid_window}</p>}
            {payload?.action && <p><span className="text-white">Try:</span> {payload.action}</p>}
            {payload?.element_hint && <p><span className="text-gray-400">Element cue:</span> {payload.element_hint}</p>}
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-gray-400">
            No birth date, birth place, real name, email, or private chart details are shown here.
          </p>
        </article>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-gray-300">
          For reflection and self-awareness, not deterministic prediction. YiShun gives one practical timing prompt — never guaranteed outcomes.
        </div>

        <div className="grid gap-3">
          <Link
            href={target}
            onClick={() => void handleCtaClick("generate_my_card")}
            className="rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-center text-sm font-bold text-white shadow-2xl shadow-black/40"
          >
            Generate my Yi Card
          </Link>
          <a
            href={`yishun://share/${encodeURIComponent(shareId)}`}
            onClick={() => void handleCtaClick("open_app")}
            className="rounded-2xl border border-white/20 px-5 py-4 text-center text-sm font-semibold text-gray-200 hover:bg-white/5"
          >
            Open in app
          </a>
        </div>
      </main>

      <footer className="flex justify-center gap-4 pb-4 text-xs text-gray-500">
        <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
        <Link href="/terms" className="hover:text-gray-300">Terms</Link>
      </footer>
    </section>
  );
}
