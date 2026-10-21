import { routing } from "@/i18n/routing";

/**
 * Search engine indexing is opt-in: only the production deployment sets ALLOW_INDEXING=true.
 * Everything else (staging, previews, local) is noindex.
 */
export function allowIndexing(): boolean {
  return process.env.ALLOW_INDEXING === "true";
}

/** Absolute site origin without trailing slash, e.g. https://nitidus.hr */
export function siteUrl(): string {
  const fromEnv =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
  return (fromEnv ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Canonical + hreflang alternates for a locale-independent path ("" for home, "/proizvodi"…). */
export function alternates(locale: string, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/${routing.defaultLocale}${path}`,
    },
  };
}
