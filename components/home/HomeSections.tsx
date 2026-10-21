import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";
import { CheckIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { InquiryForm } from "@/components/inquiry/InquiryForm";

/** Centered page intro under the photo mosaic; holds the page's h1. */
export async function IntroSection() {
  const t = await getTranslations("Home.hero");
  return (
    <section className="container-page pt-14 pb-4 text-center md:pt-16">
      <p className="font-semibold text-brand-green-700">{t("eyebrow")}</p>
      <h1 className="mx-auto mt-3 max-w-3xl text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{t("subtitle")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/proizvodi" className="btn btn-primary">
          {t("ctaProducts")}
        </Link>
        <Link href="/#kontakt" className="btn btn-accent">
          {t("ctaQuote")}
        </Link>
      </div>
    </section>
  );
}

export async function AboutSection() {
  const t = await getTranslations("Home.about");
  const tDelivery = await getTranslations("Home.delivery");
  const services = ["delivery", "refill", "equip"] as const;
  return (
    <section id="o-nama" aria-labelledby="about-title" className="container-page py-16">
      <div className="mx-auto max-w-5xl border-t border-ink pt-14">
        <header className="text-center">
          <h2 id="about-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-2 text-lg italic sm:text-xl">{t("tagline")}</p>
        </header>
        <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="space-y-4 text-lg leading-relaxed">
            <p>{t("text")}</p>
            <p>{tDelivery("text")}</p>
          </div>
          <div className="md:self-center">
            <h3 className="text-xl font-bold">{t("offerTitle")}</h3>
            <ul className="mt-4 space-y-3">
              {services.map((s) => (
                <li key={s} className="flex gap-3">
                  <CheckIcon className="mt-0.5 shrink-0 text-brand-green-700" />
                  <span>{t(`services.${s}`)}</span>
                </li>
              ))}
            </ul>
            <Link href="/#kontakt" className="btn mt-8 bg-ink text-white hover:bg-black">
              {tDelivery("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Full-width blue call-to-action band with direct phone / email links. */
export async function QuoteBanner() {
  const t = await getTranslations("Home.quote");
  return (
    <section aria-labelledby="quote-title" className="bg-brand-blue py-12 text-white md:py-14">
      <div className="container-page grid items-center gap-8 md:grid-cols-[auto_1fr_auto]">
        <MailIcon width={56} height={56} strokeWidth={1.5} className="hidden md:block" />
        <div>
          <h2 id="quote-title" className="text-2xl font-semibold tracking-tight uppercase sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-xl text-lg text-white/90">{t("text")}</p>
        </div>
        <ul className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
          {site.phones.slice(0, 1).map((p) => (
            <li key={p.href}>
              <a href={p.href} className="btn w-full bg-ink text-white hover:bg-black">
                <PhoneIcon /> {p.display}
              </a>
            </li>
          ))}
          <li>
            <a
              href={`mailto:${site.email}`}
              className="btn w-full border-2 border-white text-white hover:bg-white hover:text-brand-blue"
            >
              <MailIcon /> {site.email}
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

export async function ContactSection() {
  const t = await getTranslations("Home.contact");
  return (
    <section id="kontakt" aria-labelledby="contact-title" className="py-16">
      <div className="container-page">
        <header className="text-center">
          <h2 id="contact-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-lg text-muted">{t("subtitle")}</p>
        </header>
        <div className="mx-auto mt-10 grid max-w-6xl gap-10 lg:grid-cols-[3fr_2fr]">
          <div className="border border-ink p-6 md:p-8">
            <InquiryForm source="contact" formId="contact-form" />
          </div>
          <address className="space-y-6 not-italic">
            <div>
              <h3 className="flex items-center gap-2 font-semibold">
                <PhoneIcon /> {t("phone")}
              </h3>
              <ul className="mt-2 space-y-1">
                {site.phones.map((p) => (
                  <li key={p.href}>
                    <a href={p.href} className="text-lg font-semibold text-brand-blue hover:underline">
                      {p.display}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-semibold">
                <MailIcon /> {t("email")}
              </h3>
              <a href={`mailto:${site.email}`} className="mt-2 inline-block text-lg font-semibold text-brand-blue hover:underline">
                {site.email}
              </a>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-semibold">
                <MapPinIcon /> {t("address")}
              </h3>
              <p className="mt-2 text-lg">
                {site.address.street}
                <br />
                {site.address.postalCode} {site.address.city}
              </p>
            </div>
          </address>
        </div>
      </div>
    </section>
  );
}
