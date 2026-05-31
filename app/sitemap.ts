import type { MetadataRoute } from "next";
import { getPublicBaseUrl } from "@/lib/public-url";

const siteUrl = getPublicBaseUrl();

const routes = [
  "",
  "/reading/start",
  "/free-bazi-calculator",
  "/daily-chinese-horoscope",
  "/chinese-birth-chart",
  "/five-elements-calculator",
  "/lucky-direction-today",
  "/learn",
  "/learn/bazi-basics",
  "/tools",
  "/status",
  "/terms",
  "/privacy",
  "/account/delete",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/reading") ? 0.9 : 0.7,
  }));
}
