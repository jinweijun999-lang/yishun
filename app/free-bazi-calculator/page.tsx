import type { Metadata } from "next";
import SeoToolLanding from "../components/SeoToolLanding";

export const metadata: Metadata = {
  title: "Free BaZi Calculator | YiShun Eastern Astrology",
  description: "Generate a free BaZi birth chart preview with true solar time, Five Elements balance, and today’s decision signal.",
};

export default function Page() {
  return <SeoToolLanding eyebrow="Free BaZi Calculator" title="Get your Eastern Astrology chart in 60 seconds" description="Enter your birth date, time, and place to preview your Four Pillars profile and a practical timing signal for today." bullets={["True solar time adjustment", "Four Pillars and Day Master preview", "Five Elements balance and daily Do/Avoid guidance"]} />;
}
