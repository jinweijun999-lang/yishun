"use client";

import { useRouter } from "next/navigation";
import Background from "../../components/Background";
import Navigation from "../../components/Navigation";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const sampleData = {
  name: "Sample user",
  birthDate: "1990-05-20",
  birthTime: "08:30",
  gender: "Not specified",
  pillars: {
    year: "Ji-Si",
    month: "Yi-Chou",
    day: "Wu-Zi",
    hour: "Ren-Zi",
  },
  elements: [
    { label: "Wood", value: 20, color: "bg-green-500" },
    { label: "Fire", value: 20, color: "bg-red-500" },
    { label: "Earth", value: 40, color: "bg-yellow-600" },
    { label: "Metal", value: 0, color: "bg-gray-400" },
    { label: "Water", value: 20, color: "bg-blue-500" },
  ],
  tenGods: {
    year: "Authority",
    month: "Peer",
    day: "Day Master",
    hour: "Wealth",
  },
};

const pillarLabels = ["Year", "Month", "Day", "Hour"] as const;

export default function SamplePage() {
  const router = useRouter();

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-24">
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="Go back"
              >
                ←
              </button>
              <span className="text-xl" role="img" aria-label="Sample chart">🔮</span>
              <h1 className="text-lg font-heading font-bold text-white">Sample reading</h1>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4">
            <p className="text-xs text-accent text-center">
              This is demo data for preview only. Add your real birth details to generate a personal daily signal.
            </p>
          </div>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5" aria-labelledby="sample-profile-heading">
            <h2 id="sample-profile-heading" className="text-lg font-heading font-bold text-white mb-4">
              Profile
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-white">{sampleData.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gender</p>
                <p className="text-white">{sampleData.gender}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Birth date</p>
                <p className="text-white">{sampleData.birthDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Birth time</p>
                <p className="text-white">{sampleData.birthTime}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5" aria-labelledby="sample-pillars-heading">
            <h2 id="sample-pillars-heading" className="text-lg font-heading font-bold text-white mb-4">
              Four Pillars
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {pillarLabels.map((label, index) => {
                const value = [sampleData.pillars.year, sampleData.pillars.month, sampleData.pillars.day, sampleData.pillars.hour][index];
                const color = ["bg-accent/10", "bg-secondary/10", "bg-primary/10", "bg-green-500/10"][index];
                const textColor = ["text-accent", "text-secondary", "text-primary", "text-green-500"][index];
                return (
                  <div key={label} className={`text-center p-3 rounded-xl ${color}`}>
                    <p className={`text-xs mb-1 ${textColor}`}>{label}</p>
                    <p className="text-lg font-bold text-white">{value}</p>
                    {label === "Day" && <p className="text-xs text-gray-500 mt-1">Day Master</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5" aria-labelledby="sample-elements-heading">
            <h2 id="sample-elements-heading" className="text-lg font-heading font-bold text-white mb-4">
              Five Elements
            </h2>
            <div className="space-y-3">
              {sampleData.elements.map((element) => (
                <div key={element.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{element.label}</span>
                    <span className="text-gray-400">{element.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div className={`h-2 rounded-full ${element.color}`} style={{ width: `${element.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-surface/60 border border-white/10 p-5" aria-labelledby="sample-ten-gods-heading">
            <h2 id="sample-ten-gods-heading" className="text-lg font-heading font-bold text-white mb-4">
              Ten Gods pattern
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {pillarLabels.map((label, index) => {
                const value = [sampleData.tenGods.year, sampleData.tenGods.month, sampleData.tenGods.day, sampleData.tenGods.hour][index];
                const color = ["bg-accent/10", "bg-secondary/10", "bg-primary/10", "bg-green-500/10"][index];
                const textColor = ["text-accent", "text-secondary", "text-primary", "text-green-500"][index];
                return (
                  <div key={label} className={`text-center p-3 rounded-xl ${color}`}>
                    <p className={`text-xs mb-1 ${textColor}`}>{label}</p>
                    <p className="text-sm font-bold text-white">{value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-br from-secondary/10 to-accent/5 border border-secondary/20 p-5">
            <h3 className="text-lg font-heading font-bold text-white mb-2">Create your personal reading</h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter your birth details to unlock a complete chart and daily timing guidance.
            </p>
            <a
              href="/reading/start"
              className="block w-full px-4 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm text-center hover:bg-secondary transition-colors"
            >
              Start my free daily signal →
            </a>
          </section>
        </div>

        <Navigation />
      </main>
    </>
  );
}
