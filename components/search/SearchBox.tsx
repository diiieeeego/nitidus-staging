"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SearchIcon } from "@/components/icons";

/** Plain GET form to /pretraga; works without JavaScript. */
export function SearchBox() {
  const t = useTranslations("Search");
  const locale = useLocale();
  const id = useId();

  return (
    <form role="search" action={`/${locale}/pretraga`} method="get" className="relative">
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <input
        id={id}
        type="search"
        name="q"
        required
        minLength={2}
        maxLength={80}
        placeholder={t("placeholder")}
        className="h-11 w-full rounded-lg border border-line bg-surface pr-11 pl-4 placeholder:text-muted focus:bg-white"
      />
      <button
        type="submit"
        aria-label={t("submit")}
        className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center rounded-r-lg text-muted hover:text-ink"
      >
        <SearchIcon />
      </button>
    </form>
  );
}
