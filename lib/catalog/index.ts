import "server-only";

import catalogJson from "@/data/catalog.json";
import compatibilityJson from "@/data/compatibility.json";
import featuredJson from "@/data/featured.json";
import relationsJson from "@/data/relations.json";
import scenesJson from "@/data/scenes.json";
import {
  catalogSchema,
  compatibilitySchema,
  featuredSchema,
  relationsSchema,
  scenesSchema,
  type Category,
  type Locale,
  type Localized,
  type Product,
} from "./schema";

// Parsed once per server process; an invalid data file fails `next build`.
const catalog = catalogSchema.parse(catalogJson);
const compatibility = compatibilitySchema.parse(compatibilityJson);
const relations = relationsSchema.parse(relationsJson);
const featured = featuredSchema.parse(featuredJson);
const scenes = scenesSchema.parse(scenesJson);

const allBySlug = new Map(catalog.products.map((p) => [p.slug, p]));
const products = catalog.products.filter((p) => p.is_active).sort((a, b) => a.sort - b.sort);
const bySlug = new Map(products.map((p) => [p.slug, p]));
const categoryBySlug = new Map(catalog.categories.map((c) => [c.slug, c]));
const brandBySlug = new Map(catalog.brands.map((b) => [b.slug, b]));

for (const ref of [
  ...compatibility.flatMap((e) => [e.host, e.fits]),
  ...relations.flatMap((r) => [r.product, r.related]),
  ...featured,
  ...scenes.flatMap((s) => s.hotspots.map((h) => h.product)),
]) {
  if (!allBySlug.has(ref)) throw new Error(`catalog: reference to unknown product "${ref}"`);
}

export const PAGE_SIZE = 24;

export function pick(value: Localized, locale: Locale): string {
  return value[locale] || value.hr;
}

// ----------------------------------------------------------------------------- view models
export type CategoryRef = { slug: string; name: string };

export type ProductCard = {
  slug: string;
  sku: string | null;
  name: string;
  short: string;
  image: string | null;
  category: CategoryRef;
  brand: string | null;
};

export type ProductDetail = ProductCard & {
  kind: Product["kind"];
  description: string[];
  specs: { key: string; value: string }[];
  variants: { label: string; color: string | null; size: string | null; sku: string | null }[];
  images: string[];
  brandLogo: string | null;
  breadcrumb: CategoryRef[];
};

export type CategoryNode = CategoryRef & { image: string | null; count: number; children: CategoryNode[] };

function categoryRef(c: Category, locale: Locale): CategoryRef {
  return { slug: c.slug, name: pick(c.name, locale) };
}

function toCard(p: Product, locale: Locale): ProductCard {
  return {
    slug: p.slug,
    sku: p.sku,
    name: pick(p.name, locale),
    short: pick(p.short_description, locale),
    image: p.images[0] ?? null,
    category: categoryRef(categoryBySlug.get(p.category)!, locale),
    brand: p.brand ? brandBySlug.get(p.brand)!.name : null,
  };
}

function categoryPath(slug: string): Category[] {
  const path: Category[] = [];
  for (let c = categoryBySlug.get(slug); c; c = c.parent ? categoryBySlug.get(c.parent) : undefined) {
    path.unshift(c);
  }
  return path;
}

function descendantSlugs(slug: string): Set<string> {
  const out = new Set([slug]);
  for (const c of catalog.categories) {
    if (c.parent && out.has(c.parent)) out.add(c.slug);
  }
  return out;
}

// ----------------------------------------------------------------------------- queries
export function getCategoryTree(locale: Locale): CategoryNode[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const c of categoryPath(p.category)) counts.set(c.slug, (counts.get(c.slug) ?? 0) + 1);
  }
  const build = (parent: string | null): CategoryNode[] =>
    catalog.categories
      .filter((c) => c.parent === parent)
      .sort((a, b) => a.sort - b.sort)
      .map((c) => ({
        ...categoryRef(c, locale),
        image: c.image,
        count: counts.get(c.slug) ?? 0,
        children: build(c.slug),
      }));
  return build(null);
}

export function getCategory(slug: string, locale: Locale): (CategoryRef & { breadcrumb: CategoryRef[] }) | null {
  const c = categoryBySlug.get(slug);
  if (!c) return null;
  return { ...categoryRef(c, locale), breadcrumb: categoryPath(slug).map((x) => categoryRef(x, locale)) };
}

export function listProducts({
  locale,
  category,
  page = 1,
  pageSize = PAGE_SIZE,
}: {
  locale: Locale;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const scope = category ? descendantSlugs(category) : null;
  const matching = scope ? products.filter((p) => scope.has(p.category)) : products;
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    items: matching.slice((current - 1) * pageSize, current * pageSize).map((p) => toCard(p, locale)),
    total: matching.length,
    page: current,
    pageCount,
  };
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.slug);
}

export function getProduct(slug: string, locale: Locale): ProductDetail | null {
  const p = bySlug.get(slug);
  if (!p) return null;
  const brand = p.brand ? brandBySlug.get(p.brand)! : null;
  return {
    ...toCard(p, locale),
    kind: p.kind,
    description: p.description[locale].length ? p.description[locale] : p.description.hr,
    specs: p.specs.map((s) => ({ key: s.key, value: typeof s.value === "string" ? s.value : pick(s.value, locale) })),
    variants: p.variants.map((v) => ({ label: pick(v.label, locale), color: v.color, size: v.size, sku: v.sku })),
    images: p.images,
    brandLogo: brand?.logo ?? null,
    breadcrumb: categoryPath(p.category).map((c) => categoryRef(c, locale)),
  };
}

/**
 * Compatibility edges read in both directions:
 * `accepts` – what this product (as host) takes; `fitsInto` – hosts this product goes into.
 */
export function getCompatible(slug: string, locale: Locale) {
  const cards = (slugs: string[]) =>
    slugs.flatMap((s) => {
      const p = bySlug.get(s);
      return p ? [toCard(p, locale)] : [];
    });
  return {
    accepts: cards(compatibility.filter((e) => e.host === slug).map((e) => e.fits)),
    fitsInto: cards(compatibility.filter((e) => e.fits === slug).map((e) => e.host)),
  };
}

/** Explicit relations first, then products from the same category. */
export function getRelated(slug: string, locale: Locale, limit = 4): ProductCard[] {
  const p = bySlug.get(slug);
  if (!p) return [];
  const exclude = new Set([slug, ...compatibility.flatMap((e) => (e.host === slug ? [e.fits] : e.fits === slug ? [e.host] : []))]);
  const explicit = relations
    .filter((r) => r.product === slug)
    .map((r) => bySlug.get(r.related))
    .filter((x): x is Product => !!x && !exclude.has(x.slug));
  const sameCategory = products.filter((x) => x.category === p.category && !exclude.has(x.slug));
  const seen = new Set<string>();
  return [...explicit, ...sameCategory]
    .filter((x) => !seen.has(x.slug) && seen.add(x.slug))
    .slice(0, limit)
    .map((x) => toCard(x, locale));
}

export function getFeatured(locale: Locale): ProductCard[] {
  return featured.flatMap((s) => {
    const p = bySlug.get(s);
    return p ? [toCard(p, locale)] : [];
  });
}

/** Active scenes with hotspots of inactive products removed. */
export function getScenes(locale: Locale) {
  return scenes
    .filter((s) => s.is_active)
    .map((s) => ({
      slug: s.slug,
      image: s.image,
      aspect: s.aspect,
      title: pick(s.title, locale),
      alt: pick(s.alt, locale),
      hotspots: s.hotspots.flatMap((h) => {
        const p = bySlug.get(h.product);
        return p ? [{ x: h.x_pct, y: h.y_pct, product: toCard(p, locale) }] : [];
      }),
    }));
}

export function getBrands() {
  return catalog.brands;
}

/** Raw active products for the search index. */
export function activeProducts(): readonly Product[] {
  return products;
}

export { toCard };
