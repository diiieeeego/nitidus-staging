import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { ProductCard as Card } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, searchProducts } from "@/lib/catalog/search";
import { alternates } from "@/lib/seo";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { ProductCard } from "@/components/product/ProductCard";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("Search");
  return {
    title: t("title"),
    alternates: alternates(locale, "/pretraga"),
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/[locale]/pretraga">) {
  const t = await getTranslations("Search");
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <Suspense fallback={<p className="mt-6 text-muted">{t("loading")}</p>}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: { searchParams: PageProps<"/[locale]/pretraga">["searchParams"] }) {
  const locale = (await rootLocale()) as Locale;
  const t = await getTranslations("Search");
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, SEARCH_MAX_LENGTH) ?? "";

  if (!query) return <p className="mt-4 text-muted">{t("emptyQuery")}</p>;
  if (query.length < SEARCH_MIN_LENGTH) return <p className="mt-4 text-muted">{t("minChars", { min: SEARCH_MIN_LENGTH })}</p>;

  let results: Card[] = [];
  let failed = false;
  try {
    results = searchProducts(query, locale, 48);
  } catch (err) {
    console.error("[search] failed", err);
    failed = true;
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4">
        <p className="text-lg">{t("resultsFor", { query })}</p>
        {!failed && <p className="text-sm text-muted">{t("resultCount", { count: results.length })}</p>}
      </div>

      {results.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}

      {/* Shown for empty results and errors – also offered below results, since the item may be in stock but not listed */}
      <section
        aria-labelledby="search-miss-title"
        className={`${results.length ? "mt-16" : "mt-8"} rounded-2xl border border-brand-amber bg-brand-amber-50 p-6 md:p-8`}
      >
        {failed && (
          <p role="alert" className="mb-4 font-semibold text-red-800">
            {t("error")}
          </p>
        )}
        <h2 id="search-miss-title" className="text-2xl font-bold">
          {t("noResultsTitle")}
        </h2>
        <p className="mt-1 max-w-2xl">{t("noResultsText")}</p>
        <div className="mt-6 rounded-xl bg-white p-5 md:p-6">
          <InquiryForm source="search_miss" query={query} />
        </div>
      </section>
    </>
  );
}
