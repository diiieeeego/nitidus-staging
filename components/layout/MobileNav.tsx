"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = {
  links: { href: string; label: string }[];
  categories: { slug: string; name: string }[];
  categoriesLabel: string;
};

export function MobileNav({ links, categories, categoriesLabel }: Props) {
  const t = useTranslations("Common");
  const tNav = useTranslations("Nav");
  // Open state is tied to the pathname it was opened on, so navigating closes it
  // (routes stay mounted with Cache Components' <Activity>).
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const panelId = useId();
  const pathname = usePathname();
  const open = openedOn === pathname;
  const setOpen = (value: boolean | ((o: boolean) => boolean)) =>
    setOpenedOn((typeof value === "function" ? value(open) : value) ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface"
      >
        {open ? <CloseIcon width={24} height={24} /> : <MenuIcon width={24} height={24} />}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-white"
      >
        <nav aria-label={tNav("label")} className="container-page py-4">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 text-lg font-semibold hover:bg-surface"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 px-3 text-sm font-semibold tracking-wide text-muted uppercase">{categoriesLabel}</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={{ pathname: "/proizvodi", query: { kategorija: c.slug } }}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 hover:bg-brand-green-50"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line px-3 pt-4">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </div>
  );
}
