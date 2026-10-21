import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllProductSlugs } from "@/lib/catalog";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = ["", "/proizvodi", ...getAllProductSlugs().map((slug) => `/proizvodi/${slug}`)];
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency: path.startsWith("/proizvodi/") ? ("monthly" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path === "/proizvodi" ? 0.8 : 0.6,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`])),
      },
    })),
  );
}
