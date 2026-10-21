import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("Home.hero");
  return (
    <div className="container-page py-16">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
    </div>
  );
}
