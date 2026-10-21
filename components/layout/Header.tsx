import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryTree } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { SearchBox } from "@/components/search/SearchBox";
import { CategoriesMenu } from "./CategoriesMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const locale = (await rootLocale()) as Locale;
  const t = await getTranslations("Nav");
  const tCommon = await getTranslations("Common");
  const categories = getCategoryTree(locale)
    .filter((c) => c.count > 0)
    .map((c) => ({ slug: c.slug, name: c.name }));

  const links = [
    { href: "/proizvodi", label: t("products") },
    { href: "/#o-nama", label: t("about") },
    { href: "/#kontakt", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0 rounded-md" aria-label={`Nitidus – ${tCommon("home")}`}>
          <Logo />
        </Link>

        <nav aria-label={t("label")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            <li>
              <Link href={links[0].href} className="rounded-md px-3 py-2 font-medium whitespace-nowrap hover:bg-surface">
                {links[0].label}
              </Link>
            </li>
            <li>
              <CategoriesMenu label={t("categories")} allLabel={t("allProducts")} categories={categories} />
            </li>
            {links.slice(1).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-md px-3 py-2 font-medium whitespace-nowrap hover:bg-surface">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden w-full max-w-sm md:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <div className="hidden shrink-0 lg:block">
            <LanguageSwitcher />
          </div>
          <MobileNav links={links} categories={categories} categoriesLabel={t("categories")} />
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
