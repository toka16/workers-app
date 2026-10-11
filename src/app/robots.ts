import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/en/dashboard", "/auth", "/en/auth", "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
