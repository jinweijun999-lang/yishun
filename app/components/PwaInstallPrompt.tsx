"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function track(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.info("[YiShun PWA]", event, properties);
  window.dispatchEvent(new CustomEvent("yishun:analytics", { detail: { event, properties } }));
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(navigatorWithStandalone.standalone);
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isStandalone] = useState(() => isStandaloneMode());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      track("pwa_install_prompt_available", { platform: "web" });
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (isStandalone || dismissed || !installEvent) return null;

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    track("pwa_install_prompt_result", { outcome: choice.outcome, platform: choice.platform });
    setInstallEvent(null);
  }

  return (
    <section className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4 text-sm text-gray-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">Save YiShun to your device</p>
          <p className="mt-1 text-xs leading-5 text-gray-400">
            Install the PWA for one-tap access to your BaZi chart and daily timing signal.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleInstall} className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white">
            Install
          </button>
          <button onClick={() => setDismissed(true)} className="rounded-xl border border-white/15 px-4 py-2 text-xs text-gray-300">
            Later
          </button>
        </div>
      </div>
    </section>
  );
}
