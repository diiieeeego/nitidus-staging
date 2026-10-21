import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { locales } from "@/lib/catalog/schema";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, searchProducts } from "@/lib/catalog/search";

const querySchema = z.object({
  q: z.string().trim().min(SEARCH_MIN_LENGTH).max(SEARCH_MAX_LENGTH),
  locale: z.enum(locales).default("hr"),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }
  const { q, locale, limit } = parsed.data;
  const results = searchProducts(q, locale, limit).map((p) => ({
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    image: p.image,
    category: p.category.name,
  }));
  return NextResponse.json(
    { query: q, results },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
  );
}
