import Image from "next/image";

type Props = {
  src: string | null;
  alt: string;
  sizes: string;
  placeholderLabel: string;
  preload?: boolean;
  className?: string;
};

/** Square product image on white, or a neutral placeholder when the product has no photo yet. */
export function ProductImage({ src, alt, sizes, placeholderLabel, preload, className = "" }: Props) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-lg bg-white ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-contain p-3" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface text-muted">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <path d="M21 17l-5-5-9 8" />
          </svg>
          <span className="text-xs">{placeholderLabel}</span>
        </div>
      )}
    </div>
  );
}
