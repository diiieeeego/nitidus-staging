import { getTranslations } from "next-intl/server";
import { BrandCarousel } from "@/components/home/BrandCarousel";
import { FeaturedScenes } from "@/components/home/FeaturedScenes";
import { Hero } from "@/components/home/Hero";
import { AboutSection, ContactSection, DeliveryBanner } from "@/components/home/HomeSections";
import { getBrands } from "@/lib/catalog";

export default async function HomePage() {
  const t = await getTranslations("Home.brands");
  return (
    <>
      <Hero />
      <FeaturedScenes />
      <section aria-labelledby="brands-title" className="container-page py-12">
        <h2 id="brands-title" className="mb-6 text-2xl font-bold tracking-tight">
          {t("title")}
        </h2>
        <BrandCarousel brands={getBrands().map((b) => ({ slug: b.slug, name: b.name, logo: b.logo }))} />
      </section>
      <DeliveryBanner />
      <AboutSection />
      <ContactSection />
    </>
  );
}
