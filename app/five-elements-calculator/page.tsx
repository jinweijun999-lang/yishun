import type { Metadata } from "next";
import SeoToolLanding from "../components/SeoToolLanding";

export const metadata: Metadata = {
  title: "Five Elements Calculator | Wood Fire Earth Metal Water",
  description: "Find your Five Elements balance and receive a practical micro-action based on BaZi Eastern astrology.",
};

export default function Page() {
  return <SeoToolLanding eyebrow="Five Elements Calculator" title="Find your Wood, Fire, Earth, Metal, and Water balance" description="See which element is dominant, which is lower, and how to borrow a balancing element through color, direction, and daily action." bullets={["Accessible element chart", "Dominant and missing element summary", "Actionable micro-advice, not destiny claims"]} />;
}
