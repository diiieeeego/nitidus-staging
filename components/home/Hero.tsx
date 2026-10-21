import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const COLLAGE = [
  { src: "/products/industrijska-rola-ccin176.webp", className: "left-0 top-6 w-[46%]" },
  { src: "/products/drzac-mopa-clipper-40-cm.webp", className: "right-0 top-0 w-[48%]" },
  { src: "/products/tekuci-sapun-za-ruke-5-l.webp", className: "left-[22%] bottom-0 w-[44%]" },
];

export async function Hero() {
  const t = await getTranslations("Home.hero");
  return (
    <section className="relative overflow-hidden bg-brand-green-50">
      <div
        aria-hidden
        className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-green opacity-25 blur-3xl"
      />
      <div className="container-page relative grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="font-semibold text-brand-green-700">{t("eyebrow")}</p>
          <h1 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t("subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/proizvodi" className="btn btn-primary">
              {t("ctaProducts")}
            </Link>
            <Link href="/#kontakt" className="btn btn-accent">
              {t("ctaQuote")}
            </Link>
          </div>
        </div>
        <div aria-hidden className="relative mx-auto hidden aspect-square w-full max-w-md sm:block">
          {COLLAGE.map((img, i) => (
            <div
              key={img.src}
              className={`absolute aspect-square overflow-hidden rounded-2xl border border-white bg-white shadow-lg ${img.className}`}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="(min-width: 768px) 220px, 45vw"
                preload={i === 0}
                className="object-contain p-4"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
