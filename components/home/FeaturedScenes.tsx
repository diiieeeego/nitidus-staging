import Image from "next/image";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFeatured, getScenes } from "@/lib/catalog";
import type { Locale } from "@/lib/catalog/schema";
import { ChevronRightIcon } from "@/components/icons";
import { ProductImage } from "@/components/product/ProductImage";
import { SceneCanvas } from "./SceneCanvas";

type Scene = ReturnType<typeof getScenes>[number];

/** Gap between mosaic tiles at lg+, in px (matches `lg:gap-4`). */
const GAP = 16;

/** "4/3" -> 1.333… */
const ratio = (aspect: string) => {
  const [w, h] = aspect.split("/").map(Number);
  return w / h;
};

/** Sum of h/w of photos stacked in one column: column height = width × this. */
const stackFactor = (scenes: Scene[]) => scenes.reduce((sum, s) => sum + 1 / ratio(s.aspect), 0);

function SceneTile({ scene, sizes, preload = false }: { scene: Scene; sizes: string; preload?: boolean }) {
  return (
    <figure className="mb-4 break-inside-avoid lg:mb-0">
      <SceneCanvas
        aspect={scene.aspect}
        sceneSlug={scene.slug}
        hotspots={scene.hotspots.map((h) => ({
          x: h.x,
          y: h.y,
          product: { slug: h.product.slug, name: h.product.name, sku: h.product.sku },
        }))}
      >
        <Image
          src={scene.image}
          alt={scene.alt}
          fill
          sizes={sizes}
          preload={preload}
          unoptimized={scene.image.endsWith(".svg")}
          className="object-contain"
        />
      </SceneCanvas>
      <figcaption className="sr-only">{scene.title}</figcaption>
    </figure>
  );
}

/**
 * Full-width photo mosaic: two stacked photos | tallest (portrait) photo | intro card + widest photo.
 * Photos keep their own aspect ratio; column widths are solved so all three columns end level.
 * Below lg it falls back to a masonry flow (1 column, 2 from md).
 */
export async function SceneMosaic() {
  const locale = (await rootLocale()) as Locale;
  const t = await getTranslations("Home.scenes");
  const tNav = await getTranslations("Nav");
  const scenes = getScenes(locale);
  if (scenes.length === 0) return null;

  const center = scenes.reduce((a, b) => (ratio(b.aspect) < ratio(a.aspect) ? b : a));
  const rest = scenes.filter((s) => s !== center);
  const widest = rest.reduce<Scene | undefined>((a, b) => (!a || ratio(b.aspect) > ratio(a.aspect) ? b : a), undefined);
  const left = rest.filter((s) => s !== widest);

  // Left column: n photos stacked (n-1 gaps). Center: one photo. With flex-grow = 1/stackFactor
  // and the center's basis offset by the gaps the left column has, both columns get equal heights.
  // The right column mirrors the left's width; its intro card absorbs the remaining height.
  const leftFactor = stackFactor(left);
  const centerFactor = stackFactor([center]);
  const leftFlex = `${1 / leftFactor} 1 ${(GAP * Math.max(0, 1 - left.length)) / leftFactor}px`;
  const centerFlex = `${1 / centerFactor} 1 ${(GAP * Math.max(0, left.length - 1)) / centerFactor}px`;
  const sizes = "(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw";

  return (
    <section aria-labelledby="scenes-title" className="px-2 pt-2 sm:px-4 sm:pt-4">
      <div className="columns-1 gap-4 md:columns-2 lg:flex lg:items-start lg:gap-4">
        {/* Right column comes first in the DOM so the intro card leads on small screens. */}
        <div className="contents lg:order-3 lg:flex lg:flex-col lg:gap-4 lg:self-stretch" style={{ flex: leftFlex }}>
          <div className="mb-4 flex break-inside-avoid flex-col justify-center bg-brand-green-700 p-6 text-white lg:mb-0 lg:flex-1 xl:p-10">
            <h2 id="scenes-title" className="text-2xl font-bold tracking-tight xl:text-3xl">
              {t("title")}
            </h2>
            <p className="mt-2 text-white/90 xl:text-lg">{t("subtitle")}</p>
            <Link
              href="/proizvodi"
              className="btn mt-5 self-start bg-white text-ink hover:bg-brand-green-50"
            >
              {tNav("allProducts")}
              <ChevronRightIcon />
            </Link>
          </div>
          {widest && <SceneTile scene={widest} sizes={sizes} />}
        </div>
        <div className="contents lg:order-1 lg:flex lg:min-w-0 lg:flex-col lg:gap-4" style={{ flex: leftFlex }}>
          {left.map((s) => (
            <SceneTile key={s.slug} scene={s} sizes={sizes} />
          ))}
        </div>
        <div className="contents lg:order-2 lg:block lg:min-w-0" style={{ flex: centerFlex }}>
          <SceneTile scene={center} sizes={sizes} preload />
        </div>
      </div>
    </section>
  );
}

export async function FeaturedProducts() {
  const locale = (await rootLocale()) as Locale;
  const t = await getTranslations("Home.scenes");
  const tNav = await getTranslations("Nav");
  const tCommon = await getTranslations("Common");
  const featured = getFeatured(locale).slice(0, 12);
  if (featured.length === 0) return null;

  return (
    <section aria-labelledby="featured-title" className="container-page py-16">
      <h2 id="featured-title" className="text-center text-3xl font-bold tracking-tight">
        {t("featuredList")}
      </h2>
      <ul className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
        {featured.map((p) => (
          <li key={p.slug}>
            <article className="group relative text-center">
              <ProductImage
                src={p.image}
                alt=""
                sizes="(min-width: 1024px) 270px, (min-width: 768px) 30vw, 45vw"
                placeholderLabel={tCommon("imagePlaceholder")}
              />
              <h3 className="mt-4 leading-snug font-bold">
                <Link
                  href={`/proizvodi/${p.slug}`}
                  className="after:absolute after:inset-0 group-hover:text-brand-green-700"
                >
                  {p.sku ? `${p.sku} · ` : ""}
                  {p.name}
                </Link>
              </h3>
              <p className="mt-1 text-xs tracking-wide text-muted uppercase">{p.category.name}</p>
            </article>
          </li>
        ))}
      </ul>
      <p className="mt-12 text-center">
        <Link href="/proizvodi" className="btn btn-secondary">
          {tNav("allProducts")}
        </Link>
      </p>
    </section>
  );
}
