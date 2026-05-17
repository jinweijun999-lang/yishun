"use client";

import InteractiveBanglistPage from "../components/InteractiveBanglistPage";

export default function DailyRitualPage() {
  return (
    <InteractiveBanglistPage
      eventName="start_ritual"
      eyebrow="Daily ritual · 今日抽签"
      title="Draw one sign for today before you act."
      subtitle="Choose a focus and the next decision you are facing. YiShun returns a free omen, best time, and one grounded move."
      badge="Free result · no login required"
      fields={[
        { name: "focus", label: "What is today about?", placeholder: "", type: "select", options: ["Love", "Career", "Money", "Family", "Self"], required: true },
        { name: "question", label: "Your one-line situation", placeholder: "Should I send the message today?", required: true },
      ]}
      submitLabel="Draw today’s free sign"
      initialValues={{ focus: "Love", question: "Should I send the message today?" }}
      buildResult={(values) => {
        const focus = values.focus || "Love";
        const question = values.question || "your next move";
        return {
          scoreLabel: `${focus} omen strength`,
          score: focus === "Money" ? "78" : focus === "Career" ? "84" : "82",
          summary: `For “${question}”, the sign says: make one clean move, then wait for the reply before adding pressure.`,
          chips: [`${focus}: active window`, "Sign: Rising Wood", "Best time 15:00-17:00", "Avoid late-night impulse"],
          advice: [
            "Draw: Rising Wood — the first clean move matters more than intensity.",
            "Interpretation: do not ask for a final answer; ask for one visible next step.",
            "Today’s action: send one concise request or make one small commitment before 17:00.",
            "Avoid: re-drawing or over-checking after 22:00; it weakens the signal.",
          ],
          sections: [
            { title: "Theme", body: focus },
            { title: "Ritual path", body: "Choose theme → draw sign → read interpretation → take one action." },
          ],
        };
      }}
      shareText={(values, result) => `YiShun daily ritual for ${values.focus}: ${result.summary}`}
      paidTitle="Unlock the deep sign text + 7/30 day timing"
      paidBullets={["Deep sign interpretation", "Love / career / wealth split", "7-day action calendar", "30-day avoid windows", "Re-draw / wish reading"]}
      nextHref="/paywall?product=daily_ritual&source=daily_ritual"
      nextLabel="Unlock deep sign"
      helper="Daily Timing is only used as the best-time signal inside the ritual; it is not the main product path."
    />
  );
}
