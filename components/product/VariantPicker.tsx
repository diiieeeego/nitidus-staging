import { getTranslations } from "next-intl/server";
import type { ProductDetail } from "@/lib/catalog";

/**
 * Variant chips as plain radio inputs attached to the inquiry form via the `form`
 * attribute – the chosen variant is submitted with the inquiry, no JavaScript needed.
 */
export async function VariantPicker({ variants, formId }: { variants: ProductDetail["variants"]; formId: string }) {
  const t = await getTranslations("Product");
  const groups = [
    { name: "variantColor", label: t("colors"), items: variants.filter((v) => v.color) },
    { name: "variantSize", label: t("sizes"), items: variants.filter((v) => !v.color && v.size) },
    { name: "variantSize", label: t("options"), items: variants.filter((v) => !v.color && !v.size) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <fieldset key={g.label}>
          <legend className="text-sm font-semibold">{g.label}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {g.items.map((v) => (
              <label key={v.label} className="cursor-pointer">
                <input type="radio" name={g.name} value={v.label} form={formId} className="peer sr-only" />
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-blue hover:border-ink">
                  {v.color && (
                    <span aria-hidden className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ background: SWATCH[v.color] ?? "#ccc" }} />
                  )}
                  {v.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

const SWATCH: Record<string, string> = {
  bijela: "#ffffff",
  crna: "#1f1f1f",
  plava: "#2b59c3",
  crvena: "#c62828",
  zelena: "#3f9142",
  zuta: "#f5c518",
  bordo: "#7b1e3a",
  antracit: "#3b3f42",
  stone: "#b9b1a5",
  carbon: "#2d2f31",
  siva: "#9a9fa3",
  satin: "#c9ccce",
  "antracit-zelena": "linear-gradient(135deg,#3b3f42 50%,#3f9142 50%)",
  "antracit-crvena": "linear-gradient(135deg,#3b3f42 50%,#c62828 50%)",
  "antracit-plava": "linear-gradient(135deg,#3b3f42 50%,#2b59c3 50%)",
};
