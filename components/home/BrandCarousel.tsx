"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PauseIcon, PlayIcon } from "@/components/icons";

type Brand = { slug: string; name: string; logo: string | null };

function BrandItem({ brand }: { brand: Brand }) {
  return (
    <li className="flex h-20 w-44 shrink-0 items-center justify-center rounded-lg border border-line bg-white px-6">
      {brand.logo ? (
        <Image src={brand.logo} alt={brand.name} width={140} height={56} className="max-h-12 w-auto object-contain" />
      ) : (
        // Text placeholder until the brand logo is supplied.
        <span className="text-lg font-bold tracking-wide text-muted">{brand.name}</span>
      )}
    </li>
  );
}

/** Auto-scrolling logo strip; pauses on hover/focus, has a pause button, static with reduced motion. */
export function BrandCarousel({ brands }: { brands: Brand[] }) {
  const t = useTranslations("Home.brands");
  const [paused, setPaused] = useState(false);

  return (
    <div className="group relative">
      <div className="overflow-hidden mask-x-from-90% motion-reduce:overflow-visible">
        <div
          className={`animate-marquee flex w-max group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center ${
            paused ? "[animation-play-state:paused]" : ""
          }`}
        >
          <ul className="flex gap-4 pr-4 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0">
            {brands.map((b) => (
              <BrandItem key={b.slug} brand={b} />
            ))}
          </ul>
          {/* duplicate for a seamless loop; hidden from assistive tech */}
          <ul className="flex gap-4 pr-4 motion-reduce:hidden" aria-hidden>
            {brands.map((b) => (
              <BrandItem key={b.slug} brand={b} />
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? t("play") : t("pause")}
        className="absolute -top-14 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-surface motion-reduce:hidden"
      >
        {paused ? <PlayIcon width={16} height={16} /> : <PauseIcon width={16} height={16} />}
      </button>
    </div>
  );
}
