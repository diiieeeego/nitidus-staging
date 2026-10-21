import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryTree } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { site } from "@/lib/site";
import { FacebookIcon, InstagramIcon, LinkedInIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { Logo } from "./Logo";

const socialIcons = { facebook: FacebookIcon, instagram: InstagramIcon, linkedin: LinkedInIcon };
const socialNames = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" };

const linkClass = "text-brand-green hover:text-white hover:underline";

export async function Footer() {
  const locale = (await rootLocale()) as Locale;
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const categories = getCategoryTree(locale).filter((c) => c.count > 0);
  const links = [
    { href: "/proizvodi", label: tNav("products") },
    { href: "/#o-nama", label: tNav("about") },
    { href: "/#kontakt", label: tNav("contact") },
  ];

  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_1.6fr_1fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs font-semibold">{site.name}</p>
          <p className="mt-2 max-w-xs text-white/75">{t("tagline")}</p>
          <p className="mt-3 text-sm font-semibold text-brand-amber">{t("prices")}</p>
        </div>
        <div>
          <h2 className="font-semibold tracking-wide uppercase">{t("contact")}</h2>
          <address className="mt-4 space-y-2 text-white/75 not-italic">
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
                <a href={p.href} className={linkClass}>
                  {p.display}
                </a>
              </p>
            ))}
            <p className="flex gap-2">
              <MailIcon className="mt-0.5 shrink-0" />
              <a href={`mailto:${site.email}`} className={`break-all ${linkClass}`}>
                {site.email}
              </a>
            </p>
          </address>
        </div>
        <nav aria-labelledby="footer-categories">
          <h2 id="footer-categories" className="font-semibold tracking-wide uppercase">
            {t("categories")}
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={{ pathname: "/proizvodi", query: { kategorija: c.slug } }} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="font-semibold tracking-wide uppercase">
              {t("links")}
            </h2>
            <ul className="mt-4 space-y-1.5">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {site.social.length > 0 && (
            <>
              <h2 className="mt-8 font-semibold tracking-wide uppercase">{t("follow")}</h2>
              <ul className="mt-4 flex gap-2">
                {site.social.map(({ network, href }) => {
                  const Icon = socialIcons[network];
                  return (
                    <li key={href}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={socialNames[network]}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink hover:bg-brand-green"
                      >
                        <Icon />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="container-page py-5 text-center text-sm text-white/60">
          © {site.name} {t("rights")}
        </p>
      </div>
    </footer>
  );
}
