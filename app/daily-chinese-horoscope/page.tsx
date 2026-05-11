import type { Metadata } from "next";
import SeoToolLanding from "../components/SeoToolLanding";

export const metadata: Metadata = {
  title: "Daily Chinese Horoscope | Today’s Decision Signal",
  description: "Get a daily Chinese astrology signal based on your BaZi profile, Five Elements, and true solar time.",
};

export default function Page() {
  return <SeoToolLanding eyebrow="Daily Chinese Horoscope" title="Today’s timing signal, personalized by your birth chart" description="Use YiShun as a reflective daily timing app: best for, do, avoid, golden hour, lucky element, and why the signal appears." bullets={["Personalized daily timing score", "Do / Avoid guidance", "Shareable Today Signal card"]} />;
}
