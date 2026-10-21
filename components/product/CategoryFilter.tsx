"use client";

import { useId, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { ChevronDownIcon } from "@/components/icons";

type Option = { slug: string; name: string; count: number };
type TopCategory = Option & { children: Option[] };

type Props = {
  tree: TopCategory[];
  /** Selected top-level category slug, if any. */
  top: string | null;
  /** Selected subcategory slug, if any. */
  sub: string | null;
  labels: { label: string; category: string; subcategory: string; all: string; allSub: string };
};

/** Category + subcategory dropdowns; each change navigates to /proizvodi?kategorija=… (page reset). */
export function CategoryFilter({ tree, top, sub, labels }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const id = useId();
  const children = tree.find((c) => c.slug === top)?.children ?? [];

  const go = (slug: string) =>
    startTransition(() => router.push(slug ? { pathname: "/proizvodi", query: { kategorija: slug } } : "/proizvodi"));

  const select =
    "h-12 w-full appearance-none rounded-lg border border-line bg-white pr-10 pl-4 font-medium hover:border-ink disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:hover:border-line";

  return (
    <fieldset aria-busy={pending} className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
      <legend className="sr-only">{labels.label}</legend>
      <div>
        <label htmlFor={`${id}-top`} className="mb-1.5 block text-sm font-semibold">
          {labels.category}
        </label>
        <div className="relative">
          <select id={`${id}-top`} value={top ?? ""} onChange={(e) => go(e.target.value)} className={select}>
            <option value="">{labels.all}</option>
            {tree.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-sub`} className="mb-1.5 block text-sm font-semibold">
          {labels.subcategory}
        </label>
        <div className="relative">
          <select
            id={`${id}-sub`}
            value={sub ?? ""}
            disabled={children.length === 0}
            onChange={(e) => go(e.target.value || (top ?? ""))}
            className={select}
          >
            <option value="">{labels.allSub}</option>
            {children.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
        </div>
      </div>
    </fieldset>
  );
}
