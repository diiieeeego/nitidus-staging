"use client";

import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export type Hotspot = {
  x: number;
  y: number;
  product: { slug: string; name: string; sku: string | null };
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
      className="relative bg-surface"
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
              <span className="absolute h-5 w-5 animate-ping rounded-full bg-white opacity-50 motion-reduce:hidden sm:h-7 sm:w-7" />
              <span className="relative h-5 w-5 rounded-full bg-white shadow-[0_1px_6px_rgb(0_0_0/0.35)] ring-1 ring-ink/10 transition group-hover:scale-125 group-focus-visible:scale-125 sm:h-7 sm:w-7" />
            </button>

            <div
              id={popoverId}
              role="tooltip"
              hidden={!open}
              className={`absolute ${align} ${below ? "top-full mt-1" : "bottom-full mb-1"} pointer-events-none w-max max-w-56 rounded-lg border border-line bg-white px-3 py-2 shadow-xl`}
            >
              {h.product.sku && <p className="font-mono text-xs text-muted">{h.product.sku}</p>}
              <p className="text-sm leading-snug font-semibold">{h.product.name}</p>
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
