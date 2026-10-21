import Image from "next/image";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { getFeatured, getScenes } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { ProductCard } from "@/components/product/ProductCard";
import { SceneCanvas } from "./SceneCanvas";

export async function FeaturedScenes() {
  const locale = (await rootLocale()) as Locale;
  const t = await getTranslations("Home.scenes");
  const scenes = getScenes(locale);
  const featured = getFeatured(locale).slice(0, 12);

  return (
    <section aria-labelledby="featured-title" className="container-page py-16">
      <h2 id="featured-title" className="text-3xl font-bold tracking-tight">
        {t("title")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted">{t("subtitle")}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {scenes.map((scene, i) => (
          <figure key={scene.slug} className={i === 0 ? "lg:col-span-2" : undefined}>
            <SceneCanvas
              aspect={scene.aspect}
              sceneSlug={scene.slug}
              hotspots={scene.hotspots.map((h) => ({
                x: h.x,
                y: h.y,
                product: { slug: h.product.slug, name: h.product.name, image: h.product.image, sku: h.product.sku },
              }))}
            >
              <Image
                src={scene.image}
                alt={scene.alt}
                fill
                sizes={i === 0 ? "(min-width: 1280px) 1232px, 100vw" : "(min-width: 1024px) 50vw, 100vw"}
                unoptimized={scene.image.endsWith(".svg")}
                className="object-cover"
              />
            </SceneCanvas>
            <figcaption className="mt-2 font-semibold">{scene.title}</figcaption>
          </figure>
        ))}
      </div>

      {featured.length > 0 && (
        <>
          <h3 className="mt-14 text-xl font-bold">{t("featuredList")}</h3>
          <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {featured.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
