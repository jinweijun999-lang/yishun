import type { Metadata } from "next";
import SeoToolLanding from "../components/SeoToolLanding";

export const metadata: Metadata = {
  title: "Chinese Birth Chart Calculator | YiShun",
  description: "Create a Chinese birth chart preview with BaZi pillars, zodiac, elements, and plain-English explanations.",
};

export default function Page() {
  return <SeoToolLanding eyebrow="Chinese Birth Chart" title="Translate your birth moment into a practical profile" description="YiShun maps your birth moment into year, month, day, and hour pillars, then explains the result in simple English." bullets={["Birth profile built from BaZi / Four Pillars", "Plain-language Day Master explanation", "Entertainment-first, non-fatalistic wording"]} />;
}
