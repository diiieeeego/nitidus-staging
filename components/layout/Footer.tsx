import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryTree } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { site } from "@/lib/site";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { Logo } from "./Logo";

export async function Footer() {
  const locale = (await rootLocale()) as Locale;
  const t = await getTranslations("Footer");
  const categories = getCategoryTree(locale).filter((c) => c.count > 0);

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_2fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-muted">{t("tagline")}</p>
          <p className="mt-3 text-sm font-semibold">{t("prices")}</p>
        </div>
        <nav aria-labelledby="footer-categories">
          <h2 id="footer-categories" className="font-semibold">
            {t("categories")}
          </h2>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={{ pathname: "/proizvodi", query: { kategorija: c.slug } }}
                  className="text-muted hover:text-ink hover:underline"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-semibold">{t("contact")}</h2>
          <address className="mt-3 space-y-2 not-italic text-muted">
            <p className="flex gap-2">
              <MapPinIcon className="mt-0.5 shrink-0" />
              <span>
                {site.address.street}
                <br />
                {site.address.postalCode} {site.address.city}
              </span>
            </p>
            {site.phones.map((p) => (
              <p key={p.href} className="flex gap-2">
                <PhoneIcon className="mt-0.5 shrink-0" />
                <a href={p.href} className="hover:text-ink hover:underline">
                  {p.display}
                </a>
              </p>
            ))}
            <p className="flex gap-2">
              <MailIcon className="mt-0.5 shrink-0" />
              <a href={`mailto:${site.email}`} className="hover:text-ink hover:underline">
                {site.email}
              </a>
            </p>
          </address>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-4 text-sm text-muted">
          © {site.name} {t("rights")}
        </p>
      </div>
    </footer>
  );
}
