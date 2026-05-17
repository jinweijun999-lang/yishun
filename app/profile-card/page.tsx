"use client";

import InteractiveBanglistPage from "../components/InteractiveBanglistPage";

export default function ProfileCardPage() {
  return (
    <InteractiveBanglistPage
      eventName="generate_profile"
      eyebrow="Destiny card · 命格卡"
      title="Generate a shareable destiny card without exposing private birth data."
      subtitle="Enter a nickname and current theme. The free card gives an archetype, strength, blind spot, and today’s prompt; deep report modules stay locked."
      badge="Privacy-safe share card"
      fields={[
        { name: "nickname", label: "Nickname for the card", placeholder: "Mia", required: true },
        { name: "theme", label: "Current theme", placeholder: "", type: "select", options: ["Love", "Career", "Money", "Reset"], required: true },
      ]}
      submitLabel="Generate free destiny card"
      initialValues={{ nickname: "Mia", theme: "Career" }}
      buildResult={(values) => {
        const name = values.nickname || "You";
        const theme = values.theme || "Career";
        const archetype = theme === "Love" ? "Moon Listener" : theme === "Money" ? "Metal Builder" : "Wood Seeker";
        return {
          scoreLabel: `${name}’s archetype`,
          score: archetype,
          summary: `${name} reads the room quickly, but the ${theme.toLowerCase()} blind spot is committing before the signal is stable.`,
          chips: ["Share-safe", `${theme} keyword`, "YiShun watermark", "Private birth data hidden"],
          advice: [
            "Destiny label: you win when you move early but keep the promise practical.",
            "Today’s keyword: Clean Signal — one sharp move beats five explanations.",
            "Hit line: people think you are hesitating, but you are actually waiting for the timing to become usable.",
            "Share card hides birth date, birth place, email, and full chart details by default.",
          ],
          microCard: {
            label: `${name} · YiShun destiny card`,
            keyword: archetype,
            line: "Clean Signal: one sharp move beats five explanations.",
            watermark: "YiShun · 东方命格卡",
          },
        };
      }}
      shareText={(values, result) => `My YiShun destiny card: ${values.nickname || "I"} · ${result.score} · ${result.summary}`}
      paidTitle="Unlock the full profile report"
      paidBullets={["Personality chapter", "Love / career / wealth chapters", "Helpful people and opportunity windows", "Future 90-day forecast", "Blind spot repair plan"]}
      nextHref="/paywall?product=profile_card&source=profile_card"
      nextLabel="Unlock full profile"
      helper="The free share card is intentionally incomplete: useful identity signal now, deeper destiny report after unlock."
    />
  );
}
