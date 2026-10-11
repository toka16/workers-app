import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/data/public";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entry = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified,
    alternates: { languages: { ka: `${base}${path}`, en: `${base}/en${path === "/" ? "" : path}` } },
  });
  const workers = await getPublishedSlugs().catch(() => []);
  return [entry("/"), entry("/workers"), ...workers.map((w) => entry(`/workers/${w.slug}`, w.updatedAt))];
}
