"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { SearchIcon } from "@/components/icons";

type Result = { slug: string; name: string; sku: string | null; image: string | null; category: string };
type Status = "idle" | "loading" | "done" | "error";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

/**
 * Search combobox (WAI-ARIA combobox + listbox pattern). Without JavaScript it is a
 * plain GET form to /pretraga. Enter without an active option opens the full results.
 */
export function SearchBox() {
  const t = useTranslations("Search");
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLFormElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_CHARS) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const params = new URLSearchParams({ q: trimmed, locale, limit: "6" });
        const res = await fetch(`/api/search?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results);
        setActive(-1);
        setStatus("done");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort(); // cancel the in-flight request when the query changes
    };
  }, [trimmed, locale]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const showPanel = open && trimmed.length >= MIN_CHARS && status !== "idle";
  const hasResults = status === "done" && results.length > 0;
  const searchHref = { pathname: "/pretraga" as const, query: { q: trimmed } };

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && hasResults) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp" && hasResults) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      if (showPanel) close();
      else setQuery("");
    } else if (e.key === "Enter" && showPanel && active >= 0 && results[active]) {
      e.preventDefault();
      close();
      router.push(`/proizvodi/${results[active].slug}`);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (trimmed.length < MIN_CHARS) return;
    close();
    router.push(searchHref);
  }

  return (
    <form ref={rootRef} role="search" action={`/${locale}/pretraga`} method="get" onSubmit={onSubmit} className="relative">
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <input
        id={id}
        type="search"
        name="q"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        required
        minLength={MIN_CHARS}
        maxLength={80}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (e.target.value.trim().length < MIN_CHARS) setStatus("idle");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
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

      <div
        hidden={!showPanel}
        className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-line bg-white shadow-xl"
      >
        <p className="sr-only" role="status" aria-live="polite">
          {status === "loading"
            ? t("loading")
            : status === "error"
              ? t("error")
              : status === "done"
                ? t("resultCount", { count: results.length })
                : ""}
        </p>
        <ul id={listId} role="listbox" aria-label={t("suggestions")} className="max-h-96 overflow-y-auto py-1">
          {hasResults &&
            results.map((r, i) => (
              <li
                key={r.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onPointerDown={(e) => e.preventDefault()} // keep focus in the input
                onClick={() => {
                  close();
                  router.push(`/proizvodi/${r.slug}`);
                }}
                onPointerEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-brand-green-50" : ""}`}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-surface">
                  {r.image && <Image src={r.image} alt="" fill sizes="40px" className="object-contain p-0.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {r.sku ? `${r.sku} · ` : ""}
                    {r.category}
                  </span>
                </span>
              </li>
            ))}
        </ul>
        {status === "loading" && !hasResults && <p className="px-4 py-3 text-sm text-muted">{t("loading")}</p>}
        {(status === "error" || (status === "done" && results.length === 0)) && (
          <div className="px-4 py-3 text-sm">
            <p className="font-semibold">{status === "error" ? t("error") : t("noResultsTitle")}</p>
            <p className="mt-1 text-muted">{t("noResultsText")}</p>
            <Link href={searchHref} onClick={close} className="mt-2 inline-block font-semibold text-brand-blue hover:underline">
              {t("noResultsCta")} →
            </Link>
          </div>
        )}
        {hasResults && (
          <Link
            href={searchHref}
            onClick={close}
            className="block border-t border-line px-4 py-2.5 text-sm font-semibold text-brand-blue hover:bg-brand-blue-50"
          >
            {t("showAll")}
          </Link>
        )}
      </div>
    </form>
  );
}
