import { z } from "zod";

export const locales = ["hr", "en"] as const;
export type Locale = (typeof locales)[number];

const localized = z.object({ hr: z.string(), en: z.string() });
export type Localized = z.infer<typeof localized>;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid slug");

export const productKinds = [
  "dispenser",
  "holder",
  "consumable",
  "chemical",
  "tool",
  "packaging",
  "glassware",
  "other",
] as const;

export const categorySchema = z.object({
  slug,
  parent: slug.nullable(),
  name: localized,
  image: z.string().startsWith("/").nullable(),
  sort: z.number().int(),
});

export const brandSchema = z.object({
  slug,
  name: z.string().min(1),
  url: z.url().nullable(),
  logo: z.string().startsWith("/").nullable(),
});

export const specSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), localized]),
});

export const variantSchema = z.object({
  label: localized,
  color: z.string().nullable(),
  size: z.string().nullable(),
  sku: z.string().nullable(),
});

export const productSchema = z.object({
  slug,
  sku: z.string().min(1).nullable(),
  category: slug,
  brand: slug.nullable(),
  kind: z.enum(productKinds),
  is_active: z.boolean(),
  name: localized,
  short_description: localized,
  description: z.object({ hr: z.array(z.string()), en: z.array(z.string()) }),
  specs: z.array(specSchema),
  variants: z.array(variantSchema),
  images: z.array(z.string().startsWith("/")),
  sort: z.number().int(),
  manufacturer_url: z.url().nullable().optional(),
  dispenser_type: z.string().nullable().optional(),
});

export const catalogSchema = z
  .object({
    categories: z.array(categorySchema),
    brands: z.array(brandSchema),
    products: z.array(productSchema),
  })
  .superRefine((c, ctx) => {
    const categories = new Set(c.categories.map((x) => x.slug));
    const brands = new Set(c.brands.map((x) => x.slug));
    const seen = new Set<string>();
    for (const cat of c.categories) {
      if (cat.parent && !categories.has(cat.parent)) {
        ctx.addIssue({ code: "custom", message: `category ${cat.slug}: unknown parent ${cat.parent}` });
      }
    }
    for (const p of c.products) {
      if (seen.has(p.slug)) ctx.addIssue({ code: "custom", message: `duplicate product slug ${p.slug}` });
      seen.add(p.slug);
      if (!categories.has(p.category)) {
        ctx.addIssue({ code: "custom", message: `product ${p.slug}: unknown category ${p.category}` });
      }
      if (p.brand && !brands.has(p.brand)) {
        ctx.addIssue({ code: "custom", message: `product ${p.slug}: unknown brand ${p.brand}` });
      }
    }
  });

export const marplastSchema = z.object({
  products: z.array(productSchema),
  compatibility: z.array(z.object({ host: slug, fits: slug, note: z.string().nullable() })),
  /** Catalog SKUs marked discontinued in the Marplast sheet; hidden from the site. */
  discontinued: z.array(z.object({ sku: z.string(), reason: z.string() })),
  log: z.array(z.string()),
});

/** Directed edge: `host` (dispenser / holder / system) accepts `fits` (paper, refill, mop…). */
export const compatibilitySchema = z.array(
  z.object({
    host: slug,
    fits: slug,
    /** "auto:format" = generated assumption awaiting confirmation; null = confirmed. */
    note: z.string().nullable(),
  }),
);

export const relationsSchema = z.array(z.object({ product: slug, related: slug }));

export const featuredSchema = z.array(slug);

export const scenesSchema = z.array(
  z.object({
    slug,
    image: z.string().startsWith("/"),
    /** Intrinsic aspect ratio of the scene image, e.g. "3/2". */
    aspect: z.string().regex(/^\d+\/\d+$/),
    title: localized,
    alt: localized,
    is_active: z.boolean(),
    hotspots: z.array(
      z.object({
        product: slug,
        x_pct: z.number().min(0).max(100),
        y_pct: z.number().min(0).max(100),
      }),
    ),
  }),
);

export type Category = z.infer<typeof categorySchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Product = z.infer<typeof productSchema>;
export type Spec = z.infer<typeof specSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Scene = z.infer<typeof scenesSchema>[number];
