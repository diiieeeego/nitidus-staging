"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronDownIcon } from "@/components/icons";

type Props = {
  label: string;
  allLabel: string;
  categories: { slug: string; name: string }[];
};

export function CategoriesMenu({ label, allLabel, categories }: Props) {
  // Open state is tied to the pathname it was opened on, so navigating closes it
  // (routes stay mounted with Cache Components' <Activity>).
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  const open = openedOn === pathname;
  const setOpen = (value: boolean | ((o: boolean) => boolean)) =>
    setOpenedOn((typeof value === "function" ? value(open) : value) ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenedOn(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenedOn(null);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md px-3 py-2 font-medium hover:bg-surface"
      >
        {label}
        <ChevronDownIcon width={16} height={16} className={open ? "rotate-180 transition" : "transition"} />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="absolute left-0 top-full mt-2 w-72 rounded-lg border border-line bg-white p-2 shadow-lg"
      >
        <ul>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={{ pathname: "/proizvodi", query: { kategorija: c.slug } }}
                className="block rounded-md px-3 py-2 hover:bg-brand-green-50"
              >
                {c.name}
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t border-line pt-1">
            <Link href="/proizvodi" className="block rounded-md px-3 py-2 font-semibold text-brand-blue hover:bg-brand-blue-50">
              {allLabel}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
