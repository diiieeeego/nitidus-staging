"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** Switches language on the current route, keeping the query string (e.g. ?q= on search). */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("Common");
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label={t("language")} className={className}>
      <ul className="flex items-center gap-1">
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              onClick={(e) => {
                // Preserve the query string; the Link href alone has no access to it
                // without opting the whole header into request-time rendering.
                const query = Object.fromEntries(new URLSearchParams(window.location.search));
                if (Object.keys(query).length) {
                  e.preventDefault();
                  router.push({ pathname, query }, { locale });
                }
              }}
              className={`rounded-md px-2.5 py-1.5 text-sm font-semibold uppercase ${
                locale === current ? "bg-ink text-white" : "text-ink hover:bg-surface"
              }`}
            >
              <span aria-hidden>{locale}</span>
              <span className="sr-only">{t(`languageNames.${locale}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
