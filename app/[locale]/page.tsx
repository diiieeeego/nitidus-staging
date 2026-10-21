import { getTranslations } from "next-intl/server";
import { BrandCarousel } from "@/components/home/BrandCarousel";
import { FeaturedProducts, SceneMosaic } from "@/components/home/FeaturedScenes";
import { AboutSection, ContactSection, IntroSection, QuoteBanner } from "@/components/home/HomeSections";
import { getBrands } from "@/lib/catalog";

export default async function HomePage() {
  const t = await getTranslations("Home.brands");
  return (
    <>
      <SceneMosaic />
      <IntroSection />
      <FeaturedProducts />
      <AboutSection />
      <section aria-labelledby="brands-title" className="container-page pb-16">
        <h2 id="brands-title" className="mb-8 text-center text-2xl font-bold tracking-tight">
          {t("title")}
        </h2>
        <BrandCarousel brands={getBrands().map((b) => ({ slug: b.slug, name: b.name, logo: b.logo }))} />
      </section>
      <QuoteBanner />
      <ContactSection />
    </>
  );
}
