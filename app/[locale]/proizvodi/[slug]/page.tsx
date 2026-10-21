import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllProductSlugs, getCompatible, getProduct, getRelated, type ProductCard as Card } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { alternates, siteUrl } from "@/lib/seo";
import { ExternalIcon } from "@/components/icons";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { Gallery } from "@/components/product/Gallery";
import { ProductCard } from "@/components/product/ProductCard";
import { VariantPicker } from "@/components/product/VariantPicker";

const FORM_ID = "product-inquiry";

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/proizvodi/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await rootLocale()) as Locale;
  const product = getProduct(slug, locale);
  if (!product) return {};
  const t = await getTranslations("Common");
  const description = product.short || `${product.name} – ${product.category.name}. ${t("priceOnRequest")}.`;
  return {
    title: product.name,
    description,
    alternates: alternates(locale, `/proizvodi/${slug}`),
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: product.images[0] ? [{ url: product.images[0], alt: product.name }] : undefined,
    },
  };
}

/** Links are best-effort: if they fail the product page still renders. */
function safe<T>(fn: () => T, fallback: T): { value: T; failed: boolean } {
  try {
    return { value: fn(), failed: false };
  } catch (err) {
    console.error("[product] loading links failed", err);
    return { value: fallback, failed: true };
  }
}

export default async function ProductPage({ params }: PageProps<"/[locale]/proizvodi/[slug]">) {
  const { slug } = await params;
  const locale = (await rootLocale()) as Locale;
  const product = getProduct(slug, locale);
  if (!product) notFound();

  const t = await getTranslations("Product");
  const tc = await getTranslations("Common");
  const tSpecs = await getTranslations("Specs");
  const tNav = await getTranslations("Nav");

  const compatible = safe(() => getCompatible(slug, locale), { accepts: [], fitsInto: [] });
  const related = safe(() => getRelated(slug, locale), [] as Card[]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    category: product.breadcrumb.map((c) => c.name).join(" > "),
    ...(product.short ? { description: product.short } : {}),
    ...(product.images.length ? { image: product.images.map((src) => `${siteUrl()}${src}`) } : {}),
    url: `${siteUrl()}/${locale}/proizvodi/${slug}`,
  };

  // Skip the description when it only repeats the short text shown under the title.
  const descriptionBlocks =
    product.description.join(" ") === product.short ? [] : groupDescription(product.description);

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label={t("breadcrumb")}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <li>
            <Link href="/" className="hover:text-ink hover:underline">
              {tc("home")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/proizvodi" className="hover:text-ink hover:underline">
              {tNav("products")}
            </Link>
          </li>
          {product.breadcrumb.map((c) => (
            <li key={c.slug} className="flex items-center gap-2">
              <span aria-hidden>/</span>
              <Link
                href={{ pathname: "/proizvodi", query: { kategorija: c.slug } }}
                className="hover:text-ink hover:underline"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <Gallery images={product.images} alt={product.name} />

        <div>
          {product.brand && <p className="font-semibold text-brand-green-700">{product.brand}</p>}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{product.name}</h1>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {product.sku && (
              <div className="flex gap-1">
                <dt className="text-muted">{t("sku")}:</dt>
                <dd className="font-semibold tabular-nums">{product.sku}</dd>
              </div>
            )}
            <div className="flex gap-1">
              <dt className="text-muted">{t("category")}:</dt>
              <dd>
                <Link
                  href={{ pathname: "/proizvodi", query: { kategorija: product.category.slug } }}
                  className="font-semibold text-brand-blue hover:underline"
                >
                  {product.category.name}
                </Link>
              </dd>
            </div>
          </dl>
          {product.short && <p className="mt-4 text-lg text-muted">{product.short}</p>}

          {product.variants.length > 0 && (
            <div className="mt-6">
              <VariantPicker variants={product.variants} formId={FORM_ID} />
            </div>
          )}

          <div className="mt-8 rounded-xl border border-line bg-surface p-5">
            <p className="text-lg font-bold text-brand-blue">{tc("priceOnRequest")}</p>
            <p className="mt-1 text-sm text-muted">{t("quoteHint")}</p>
            <a href="#upit" className="btn btn-primary mt-4 w-full sm:w-auto">
              {t("requestQuote")}
            </a>
          </div>

          {product.manufacturerUrl && (
            <a
              href={product.manufacturerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
            >
              {t("manufacturerPage")} <ExternalIcon width={16} height={16} />
            </a>
          )}
        </div>
      </div>

      {(descriptionBlocks.length > 0 || product.specs.length > 0) && (
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          {descriptionBlocks.length > 0 && (
            <section aria-labelledby="desc-title">
              <h2 id="desc-title" className="text-2xl font-bold">
                {t("description")}
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed">
                {descriptionBlocks.map((block, i) =>
                  block.type === "list" ? (
                    <ul key={i} className="list-disc space-y-1 pl-5">
                      {block.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}>{block.text}</p>
                  ),
                )}
              </div>
            </section>
          )}
          {product.specs.length > 0 && (
            <section aria-labelledby="specs-title">
              <h2 id="specs-title" className="text-2xl font-bold">
                {t("specs")}
              </h2>
              <table className="mt-4 w-full text-left">
                <tbody>
                  {product.specs.map((s) => (
                    <tr key={s.key} className="border-b border-line">
                      <th scope="row" className="w-1/2 py-2.5 pr-4 font-medium text-muted">
                        {tSpecs.has(s.key) ? tSpecs(s.key) : s.key}
                      </th>
                      <td className="py-2.5 font-semibold">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}

      {compatible.failed || related.failed ? (
        <p className="mt-14 rounded-xl bg-surface p-4 text-muted">{t("linksUnavailable")}</p>
      ) : null}
      <CardSection id="accepts" title={t("accepts")} hint={t("acceptsHint")} items={compatible.value.accepts} />
      <CardSection id="fits-into" title={t("fitsInto")} hint={t("fitsIntoHint")} items={compatible.value.fitsInto} />
      <CardSection id="related" title={t("related")} items={related.value} />

      <section id="upit" aria-labelledby="inquiry-title" className="mt-16 scroll-mt-24 rounded-2xl border border-line bg-white p-6 md:p-8">
        <h2 id="inquiry-title" className="text-2xl font-bold">
          {t("requestQuote")}
        </h2>
        <p className="mt-1 text-muted">{t("quoteHint")}</p>
        <div className="mt-6">
          <InquiryForm source="product" product={{ slug: product.slug, name: product.name }} formId={FORM_ID} />
        </div>
      </section>
    </div>
  );
}

function CardSection({ id, title, hint, items }: { id: string; title: string; hint?: string; items: Card[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={`${id}-title`} className="mt-14">
      <h2 id={`${id}-title`} className="text-2xl font-bold">
        {title}
      </h2>
      {hint && <p className="mt-1 text-muted">{hint}</p>}
      <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type Block = { type: "list"; items: string[] } | { type: "text"; text: string };

/** Lines starting with "- " become bullet lists, other lines paragraphs. */
function groupDescription(lines: string[]): Block[] {
  const blocks: Block[] = [];
  for (const line of lines) {
    if (line.startsWith("- ")) {
      const last = blocks.at(-1);
      if (last?.type === "list") last.items.push(line.slice(2));
      else blocks.push({ type: "list", items: [line.slice(2)] });
    } else {
      blocks.push({ type: "text", text: line });
    }
  }
  return blocks;
}
