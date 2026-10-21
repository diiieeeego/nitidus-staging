import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategory, getCategoryTree, listProducts } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { alternates } from "@/lib/seo";
import { ProductCard } from "@/components/product/ProductCard";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("Products");
  return { title: t("title"), description: t("description"), alternates: alternates(locale, "/proizvodi") };
}

export default async function ProductsPage({ searchParams }: PageProps<"/[locale]/proizvodi">) {
  const t = await getTranslations("Products");
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("description")}</p>
      <Suspense fallback={<ListSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function ProductList({ searchParams }: { searchParams: PageProps<"/[locale]/proizvodi">["searchParams"] }) {
  const locale = (await rootLocale()) as Locale;
  const t = await getTranslations("Products");
  const params = await searchParams;
  const categorySlug = first(params.kategorija);
  const category = categorySlug ? getCategory(categorySlug, locale) : null;
  const page = Number.parseInt(first(params.stranica) ?? "1", 10) || 1;
  const result = listProducts({ locale, category: category?.slug, page });

  const tree = getCategoryTree(locale).filter((c) => c.count > 0);
  const activeTop = category ? category.breadcrumb[0].slug : null;
  const subcategories = tree.find((c) => c.slug === activeTop)?.children.filter((c) => c.count > 0) ?? [];

  const pageHref = (p: number) => ({
    pathname: "/proizvodi" as const,
    query: { ...(category ? { kategorija: category.slug } : {}), ...(p > 1 ? { stranica: String(p) } : {}) },
  });
  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-4 py-1.5 text-sm font-medium ${
      active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
    }`;

  return (
    <>
      <nav aria-label={t("filterLabel")} className="mt-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href="/proizvodi" className={chip(!category)} aria-current={!category ? "page" : undefined}>
              {t("allCategories")}
            </Link>
          </li>
          {tree.map((c) => (
            <li key={c.slug}>
              <Link
                href={{ pathname: "/proizvodi", query: { kategorija: c.slug } }}
                className={chip(activeTop === c.slug)}
                aria-current={category?.slug === c.slug ? "page" : undefined}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        {subcategories.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            {subcategories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={{ pathname: "/proizvodi", query: { kategorija: c.slug } }}
                  className={`${chip(category?.slug === c.slug)} text-xs`}
                  aria-current={category?.slug === c.slug ? "page" : undefined}
                >
                  {c.name} <span className="ml-1 opacity-70">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="mt-6 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">{category?.name ?? t("allCategories")}</h2>
        <p className="text-sm text-muted" aria-live="polite">
          {t("count", { count: result.total })}
        </p>
      </div>

      {result.items.length === 0 ? (
        <p className="mt-6 rounded-xl bg-surface p-6 text-muted">{t("empty")}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {result.items.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}

      {result.pageCount > 1 && (
        <nav aria-label={t("pagination")} className="mt-10 flex items-center justify-between gap-4">
          {result.page > 1 ? (
            <Link href={pageHref(result.page - 1)} rel="prev" className="btn btn-secondary">
              {t("previous")}
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-muted">{t("page", { page: result.page, pageCount: result.pageCount })}</p>
          {result.page < result.pageCount ? (
            <Link href={pageHref(result.page + 1)} rel="next" className="btn btn-secondary">
              {t("next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden className="mt-8 animate-pulse">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-10 w-32 rounded-full bg-surface" />
        ))}
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
