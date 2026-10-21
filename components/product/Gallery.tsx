"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations("Common");
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-white">
        {current ? (
          <Image src={current} alt={alt} fill preload sizes="(min-width: 1024px) 560px, 100vw" className="object-contain p-6" />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface text-muted">{t("imagePlaceholder")}</div>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-pressed={i === index}
                aria-label={`${alt} – ${i + 1}/${images.length}`}
                className={`relative block h-20 w-20 overflow-hidden rounded-lg border-2 bg-white ${
                  i === index ? "border-brand-green-700" : "border-line"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
