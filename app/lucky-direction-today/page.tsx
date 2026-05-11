import type { Metadata } from "next";
import SeoToolLanding from "../components/SeoToolLanding";

export const metadata: Metadata = {
  title: "Lucky Direction Today | YiShun BaZi Timing",
  description: "Discover today’s lucky direction and element using Eastern astrology for practical decision timing.",
};

export default function Page() {
  return <SeoToolLanding eyebrow="Lucky Direction Today" title="Find today’s lucky direction and balancing element" description="Your favorable element can be translated into a direction, color, and micro-action to support steadier decisions today." bullets={["Direction mapped from Five Elements", "Golden hour and lucky element", "Built for quick mobile sharing"]} />;
}
