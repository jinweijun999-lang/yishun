import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YiShun: BaZi Daily Astrology",
    short_name: "YiShun",
    description:
      "Free BaZi chart, daily Eastern astrology signals, true solar time, and practical timing guidance.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#090a0a",
    theme_color: "#6f9a84",
    categories: ["lifestyle", "utilities"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icons/yishun-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/yishun-icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/yishun-icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/icons/yishun-screenshot-wide.svg",
        sizes: "1280x720",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "YiShun desktop daily signal preview",
      },
      {
        src: "/icons/yishun-screenshot-mobile.svg",
        sizes: "390x844",
        type: "image/svg+xml",
        form_factor: "narrow",
        label: "YiShun mobile BaZi reading flow",
      },
    ],
    shortcuts: [
      {
        name: "Start Free Reading",
        short_name: "Reading",
        description: "Create a 60-second BaZi birth profile and daily signal.",
        url: "/reading/start?source=pwa_shortcut",
        icons: [{ src: "/icons/yishun-icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
      },
      {
        name: "Free BaZi Calculator",
        short_name: "BaZi",
        description: "Open the SEO BaZi calculator landing page.",
        url: "/free-bazi-calculator?source=pwa_shortcut",
        icons: [{ src: "/icons/yishun-icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
      },
    ],
  };
}
