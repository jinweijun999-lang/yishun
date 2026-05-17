"use client";

import InteractiveBanglistPage from "../components/InteractiveBanglistPage";

export default function CompatibilityPage() {
  return (
    <InteractiveBanglistPage
      eventName="complete_compatibility"
      eyebrow="Compatibility · 测我和 TA"
      title="Check the spark, the friction, and the next move with TA."
      subtitle="Enter two nicknames and a relationship mode. The free preview returns a match signal, attraction, conflict, and one next move; deep trend stays locked."
      badge="Free compatibility preview"
      fields={[
        { name: "you", label: "Your nickname", placeholder: "Me", required: true },
        { name: "them", label: "TA nickname", placeholder: "TA", required: true },
        { name: "theirBirthday", label: "TA birthday or age cue", placeholder: "1998-08-08 or unknown", required: false },
        { name: "theirGender", label: "TA gender / energy", placeholder: "", type: "select", options: ["Unknown", "Feminine", "Masculine", "Non-binary"], required: false },
        { name: "mode", label: "Relationship mode", placeholder: "", type: "select", options: ["Love", "Friend", "Work", "Unclear"], required: true },
      ]}
      submitLabel="Check free compatibility"
      initialValues={{ you: "Me", them: "TA", theirBirthday: "unknown", theirGender: "Unknown", mode: "Love" }}
      buildResult={(values) => {
        const you = values.you || "You";
        const them = values.them || "TA";
        const mode = values.mode || "Love";
        const score = mode === "Work" ? "71%" : mode === "Friend" ? "80%" : "76%";
        return {
          scoreLabel: `${you} × ${them}`,
          score,
          summary: `${you} and ${them} have real ${mode.toLowerCase()} pull, but the match works only if pace and response timing are managed carefully.`,
          chips: ["Attraction: high", "Conflict: tempo", "Advance: yes, softly", "Best window 19:00-21:00"],
          advice: [
            "Attraction point: the pull comes from contrast — one side initiates, the other stabilizes.",
            "Conflict point: the issue is pace, not interest. Too much pressure turns curiosity into avoidance.",
            "Advice: send one low-pressure invitation instead of asking for a definition now.",
            "Should you advance? Yes, but only with a reversible next step.",
            "Best communication window: 19:00-21:00; avoid testing them after midnight.",
          ],
        };
      }}
      shareText={(values, result) => `YiShun compatibility for ${values.you || "me"} × ${values.them || "TA"}: ${result.summary}`}
      paidTitle="Unlock 30/90 day relationship depth"
      paidBullets={["Future 30/90 day relationship trend", "Conflict repair scripts", "Reunion / advance probability", "Best timing to advance", "Partner profile library"]}
      nextHref="/paywall?product=compatibility&source=compatibility"
      nextLabel="Unlock relationship depth"
      helper="Partner details are used only for this lightweight preview in D1; the page does not persist a partner profile."
    />
  );
}
