import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductCard as Card } from "@/lib/catalog";
import { ProductImage } from "./ProductImage";

export async function ProductCard({ product, headingLevel = "h3" }: { product: Card; headingLevel?: "h2" | "h3" }) {
  const t = await getTranslations("Common");
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-line bg-white p-3 transition hover:border-brand-green hover:shadow-md">
      <ProductImage
        src={product.image}
        alt=""
        sizes="(min-width: 1280px) 240px, (min-width: 768px) 30vw, 45vw"
        placeholderLabel={t("imagePlaceholder")}
      />
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs font-medium text-muted">
          {product.brand ? `${product.brand} · ` : ""}
          {product.category.name}
        </p>
        <Heading className="mt-1 font-semibold leading-snug">
          <Link
            href={`/proizvodi/${product.slug}`}
            className="after:absolute after:inset-0 after:rounded-xl group-hover:text-brand-green-700"
          >
            {product.name}
          </Link>
        </Heading>
        {product.sku && <p className="mt-1 text-xs text-muted tabular-nums">{product.sku}</p>}
        <p className="mt-auto pt-3 text-sm font-semibold text-brand-blue">{t("priceOnRequest")}</p>
      </div>
    </article>
  );
}
