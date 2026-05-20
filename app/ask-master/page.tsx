"use client";

import InteractiveBanglistPage from "../components/InteractiveBanglistPage";

export default function AskMasterPage() {
  return (
    <InteractiveBanglistPage
      eventName="ask_master_preview"
      eyebrow="AI Master · 问事"
      title="Ask the AI Master for one decision, not a generic chat reply."
      subtitle="Choose love, career, money, or relationship. The free preview gives a conclusion, risk, and next action; the full answer unlocks 3 reasons plus a 7/30-day plan."
      badge="Free structured answer preview"
      fields={[
        { name: "domain", label: "Question domain", placeholder: "", type: "select", options: ["Love", "Career", "Money", "Relationship", "Other"], required: true },
        { name: "question", label: "Your one focused question", placeholder: "Should I take the offer this month?", required: true },
      ]}
      submitLabel="Get free AI Master preview"
      initialValues={{ domain: "Career", question: "Should I take the offer this month?" }}
      buildResult={(values) => {
        const domain = values.domain || "Career";
        const question = values.question || "your next move";
        return {
          scoreLabel: `${domain} clarity`,
          score: domain === "Money" ? "Caution" : "Clear",
          summary: `For “${question}”, the safer answer is yes only if you make a small reversible move instead of asking for final commitment now.`,
          chips: [domain, "3 reasons", "Risk checked", "7/30-day plan", "Best time 15:00-17:00"],
          advice: [
            "Conclusion: proceed with one small reversible move.",
            "Reason 1: the signal is positive, but only when the ask is specific.",
            "Reason 2: the other side needs a clear next step, not emotional pressure.",
            "Reason 3: today favors a contained message during the afternoon window.",
            "Risk: forcing certainty too early will reduce response quality.",
            "7-day action: ask for one concrete next step; 30-day action: review the pattern before escalating.",
            "Today’s timing: good for outreach at 15:00-17:00; avoid late-night decisions after 22:00.",
          ],
        };
      }}
      shareText={(values, result) => `YiShun Ask Master preview for ${values.domain}: ${result.summary}`}
      paidTitle="Use Ask Credit for the full AI Master answer"
      paidBullets={["Full conclusion and 3-evidence reasoning", "Risk and boundary check", "7/30 day action plan", "Today’s good/avoid timing", "Follow-up question prompt"]}
      nextHref="/paywall?product=ask_master&source=ask_master"
      nextLabel="Unlock full AI Master answer · $2.99"
      helper="AI Master answers cost $2.99 or 1 question credit. Full Report unlock is separate, so users always know what they are buying."
    />
  );
}
