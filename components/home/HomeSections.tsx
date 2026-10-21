import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";
import { CheckIcon, MailIcon, MapPinIcon, PhoneIcon, TruckIcon } from "@/components/icons";
import { InquiryForm } from "@/components/inquiry/InquiryForm";

export async function DeliveryBanner() {
  const t = await getTranslations("Home.delivery");
  return (
    <section aria-labelledby="delivery-title" className="container-page py-8">
      <div className="flex flex-col gap-6 rounded-2xl bg-brand-amber p-8 sm:flex-row sm:items-center sm:justify-between md:p-10">
        <div className="flex gap-4">
          <TruckIcon width={40} height={40} className="shrink-0" />
          <div>
            <h2 id="delivery-title" className="text-2xl font-bold">
              {t("title")}
            </h2>
            <p className="mt-2 max-w-2xl">{t("text")}</p>
          </div>
        </div>
        <Link href="/#kontakt" className="btn shrink-0 bg-ink text-white hover:bg-black">
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}

export async function AboutSection() {
  const t = await getTranslations("Home.about");
  const services = ["delivery", "refill", "equip"] as const;
  return (
    <section id="o-nama" aria-labelledby="about-title" className="container-page py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 id="about-title" className="text-3xl font-bold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted">{t("text")}</p>
        </div>
        <ul className="space-y-3 self-center">
          {services.map((s) => (
            <li key={s} className="flex gap-3 rounded-xl border border-line bg-white p-4">
              <CheckIcon className="mt-0.5 shrink-0 text-brand-green-700" />
              <span className="font-medium">{t(`services.${s}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function ContactSection() {
  const t = await getTranslations("Home.contact");
  return (
    <section id="kontakt" aria-labelledby="contact-title" className="bg-surface py-16">
      <div className="container-page">
        <h2 id="contact-title" className="text-3xl font-bold tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{t("subtitle")}</p>
        <div className="mt-8 grid gap-10 lg:grid-cols-[3fr_2fr]">
          <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
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
