import type { MetadataRoute } from "next";
import { getPublicBaseUrl } from "@/lib/public-url";

const siteUrl = getPublicBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/dashboard/", "/profile/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
