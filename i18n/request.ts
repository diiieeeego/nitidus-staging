import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

// The locale comes from the `[locale]` root segment via next/root-params, which keeps
// pages statically renderable with Cache Components (no headers() access).
// Server Actions and Route Handlers can't read root params; they pass the locale
// explicitly, e.g. getTranslations({ locale, namespace }).
export default getRequestConfig(async ({ locale: explicit }) => {
  const candidate = explicit ?? (await rootLocale());
  const locale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Europe/Zagreb",
  };
});
