"use client";

import Image from "next/image";
import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export type Hotspot = {
  x: number;
  y: number;
  product: { slug: string; name: string; image: string | null; sku: string | null };
};

const subscribeNoop = () => () => {};

/** `?editPins=1` in development: clicking the scene logs x_pct / y_pct for data/scenes.json. */
function useEditMode() {
  return useSyncExternalStore(
    subscribeNoop,
    () => process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("editPins"),
    () => false,
  );
}

export function SceneCanvas({
  hotspots,
  aspect,
  sceneSlug,
  children,
}: {
  hotspots: Hotspot[];
  aspect: string;
  sceneSlug: string;
  children: ReactNode;
}) {
  const t = useTranslations("Home.scenes");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const [picked, setPicked] = useState<{ x: number; y: number } | null>(null);
  const pointerType = useRef<string>("mouse");
  const baseId = useId();
  const editMode = useEditMode();

  function onPinClick(i: number, slug: string) {
    // Touch: first tap shows the popover, second tap navigates.
    if (pointerType.current === "touch" && active !== i) {
      setActive(i);
      return;
    }
    router.push(`/proizvodi/${slug}`);
  }

  function onCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setPicked({ x, y });
    console.info(`[${sceneSlug}] { "x_pct": ${x}, "y_pct": ${y} }`);
  }

  return (
    <div
      className="relative rounded-xl border border-line bg-surface [&>img]:rounded-xl"
      style={{ aspectRatio: aspect }}
      onClick={onCanvasClick}
      onKeyDown={(e) => e.key === "Escape" && setActive(null)}
    >
      {children}

      {hotspots.map((h, i) => {
        const open = active === i;
        const popoverId = `${baseId}-${i}`;
        const below = h.y < 35;
        const align = h.x > 70 ? "right-0" : h.x < 30 ? "left-0" : "left-1/2 -translate-x-1/2";
        return (
          <div
            key={`${h.product.slug}-${i}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${h.x}%`, top: `${h.y}%`, zIndex: open ? 20 : 10 }}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive((a) => (a === i ? null : a))}
            onFocus={() => setActive(i)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive((a) => (a === i ? null : a));
            }}
          >
            <button
              type="button"
              aria-label={t("pinLabel", { name: h.product.name })}
              aria-describedby={open ? popoverId : undefined}
              onPointerDown={(e) => (pointerType.current = e.pointerType)}
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(i, h.product.slug);
              }}
              className="group flex h-11 w-11 items-center justify-center rounded-full"
            >
              <span className="absolute h-5 w-5 animate-ping rounded-full bg-brand-amber opacity-60 motion-reduce:hidden sm:h-7 sm:w-7" />
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white sm:h-7 sm:w-7 sm:border-[3px] bg-brand-amber shadow-md ring-1 ring-ink/20 transition group-hover:scale-110 group-focus-visible:scale-110">
                <span className="h-1.5 w-1.5 rounded-full bg-ink sm:h-2 sm:w-2" />
              </span>
            </button>

            <div
              id={popoverId}
              role="tooltip"
              hidden={!open}
              className={`absolute ${align} ${below ? "top-full mt-1" : "bottom-full mb-1"} w-52 rounded-lg border sm:w-56 border-line bg-white p-3 shadow-xl`}
            >
              <div className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface">
                  {h.product.image ? (
                    <Image src={h.product.image} alt="" fill sizes="56px" className="object-contain p-1" />
                  ) : (
                    <span className="sr-only">{tc("imagePlaceholder")}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-snug font-semibold">{h.product.name}</p>
                  {h.product.sku && <p className="text-xs text-muted">{h.product.sku}</p>}
                </div>
              </div>
              <Link
                href={`/proizvodi/${h.product.slug}`}
                className="mt-2 block rounded-md bg-brand-green-700 px-3 py-1.5 text-center text-sm font-semibold text-white hover:bg-[#336322]"
              >
                {tc("view")}
              </Link>
            </div>
          </div>
        );
      })}

      {editMode && (
        <p className="absolute top-2 left-2 z-30 rounded bg-ink/85 px-2 py-1 font-mono text-xs text-white">
          {t("editHint")} {picked && `x_pct: ${picked.x}, y_pct: ${picked.y}`}
        </p>
      )}
    </div>
  );
}
