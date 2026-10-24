import type { MetadataRoute } from "next";
import { getCategories, getPublishedComparisons, getTools } from "@/lib/data";
import { abs } from "@/lib/seo";

export const revalidate = 3600;

/** Only published pages are listed. Drip-fed pages appear as they go live. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, tools, comps] = await Promise.all([getCategories(), getTools(), getPublishedComparisons()]);
  return [
    { url: abs("/"), changeFrequency: "daily", priority: 1 },
    ...cats.map((c) => ({ url: abs(`/category/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.9 })),
    ...tools.map((t) => ({ url: abs(`/tools/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...tools.map((t) => ({ url: abs(`/alternatives/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...comps.map((c) => ({
      url: abs(`/compare/${c.slug}`),
      lastModified: c.published_at ? new Date(c.published_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
