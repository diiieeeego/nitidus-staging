import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Errors");
  return (
    <div className="container-page py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-green-700">404</p>
      <h1 className="mt-4 text-3xl font-bold">{t("notFoundTitle")}</h1>
      <p className="mt-3 text-muted">{t("notFoundText")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          {t("backHome")}
        </Link>
        <Link href="/proizvodi" className="btn btn-secondary">
          {t("browseProducts")}
        </Link>
      </div>
    </div>
  );
}
