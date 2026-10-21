import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategory, getCategoryTree, listProducts } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { alternates } from "@/lib/seo";
import { CategoryFilter } from "@/components/product/CategoryFilter";
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

  const tree = getCategoryTree(locale)
    .filter((c) => c.count > 0)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: c.count,
      children: c.children
        .filter((s) => s.count > 0)
        .map((s) => ({ slug: s.slug, name: s.name, count: s.count })),
    }));
  const activeTop = category ? category.breadcrumb[0].slug : null;
  const activeSub = category && category.breadcrumb.length > 1 ? category.slug : null;

  const pageHref = (p: number) => ({
    pathname: "/proizvodi" as const,
    query: { ...(category ? { kategorija: category.slug } : {}), ...(p > 1 ? { stranica: String(p) } : {}) },
  });
  return (
    <>
      <CategoryFilter
        tree={tree}
        top={activeTop}
        sub={activeSub}
        labels={{
          label: t("filterLabel"),
          category: t("category"),
          subcategory: t("subcategory"),
          all: t("allCategories"),
          allSub: t("allSubcategories"),
        }}
      />

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
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="h-[4.625rem] rounded-lg bg-surface" />
        <div className="h-[4.625rem] rounded-lg bg-surface" />
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
