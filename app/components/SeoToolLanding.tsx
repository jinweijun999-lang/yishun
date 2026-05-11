import Link from "next/link";
import Background from "./Background";

type SeoToolLandingProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

export default function SeoToolLanding({ eyebrow, title, description, bullets }: SeoToolLandingProps) {
  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-16">
        <section className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-3xl border border-secondary/20 bg-surface/75 p-6 sm:p-8 shadow-2xl">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">← YiShun</Link>
            <p className="mt-8 text-xs uppercase tracking-[0.3em] text-accent/80">{eyebrow}</p>
            <h1 className="mt-3 text-3xl sm:text-5xl font-heading font-bold text-white text-glow">{title}</h1>
            <p className="mt-4 text-base leading-7 text-gray-300">{description}</p>
            <ul className="mt-6 grid gap-3 text-sm text-gray-300">
              {bullets.map((bullet) => (
                <li key={bullet} className="rounded-2xl border border-white/10 bg-white/5 p-4">✓ {bullet}</li>
              ))}
            </ul>
            <Link href="/reading/start" className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-secondary to-accent px-5 py-4 text-sm font-bold text-white">
              Start Free Reading
            </Link>
            <p className="mt-4 text-xs text-gray-500">YiShun translates BaZi, Five Elements, Yin/Yang, Ten Gods, and true solar time into practical self-reflection prompts. Entertainment only.</p>
          </div>
        </section>
      </main>
    </>
  );
}
