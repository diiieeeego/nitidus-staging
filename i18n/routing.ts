import { defineRouting } from "next-intl/routing";
import { locales } from "@/lib/catalog/schema";

export const routing = defineRouting({
  locales,
  defaultLocale: "hr",
  localePrefix: "always",
});
