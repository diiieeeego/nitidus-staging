"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { site } from "@/lib/site";
import {
  ChevronRightIcon,
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  MapPinIcon,
  MenuIcon,
  PhoneIcon,
} from "@/components/icons";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

type Props = {
  links: { href: string; label: string }[];
  categories: { slug: string; name: string }[];
  categoriesLabel: string;
};

const socialIcons = { facebook: FacebookIcon, instagram: InstagramIcon, linkedin: LinkedInIcon };
const socialNames = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" };

const noopSubscribe = () => () => {};

export function MobileNav({ links, categories, categoriesLabel }: Props) {
  const t = useTranslations("Common");
  const tNav = useTranslations("Nav");
  // Open state is tied to the pathname it was opened on, so navigating closes it
  // (routes stay mounted with Cache Components' <Activity>).
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const panelId = useId();
  const titleId = useId();
  const pathname = usePathname();
  const open = openedOn === pathname;
  const close = () => setOpenedOn(null);
  // The panel is portaled to <body>: the header's backdrop-filter would otherwise
  // become the containing block of the fixed panel and clip it to the header.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      toggle?.focus({ preventScroll: true });
    };
  }, [open]);

  const quickLinks = [
    { href: site.phones[0].href, label: tNav("call"), detail: site.phones[0].display, Icon: PhoneIcon },
    { href: `mailto:${site.email}`, label: tNav("email"), detail: site.email, Icon: MailIcon },
  ];

  const panel = (
    <div className="lg:hidden">
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-[100] bg-ink/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!open}
        className={`fixed inset-y-0 right-0 z-[101] flex h-dvh w-full max-w-sm flex-col bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Link href="/" onClick={close} className="rounded-md" aria-label={`Nitidus – ${t("home")}`}>
            <Logo />
          </Link>
          <h2 id={titleId} className="sr-only">
            {tNav("menu")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label={t("closeMenu")}
            onClick={close}
            className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface"
          >
            <CloseIcon width={24} height={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <section aria-labelledby={`${titleId}-quick`}>
            <h3 id={`${titleId}-quick`} className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">
              {tNav("quickLinks")}
            </h3>
            <Link href="/#kontakt" onClick={close} className="btn btn-accent mt-3 w-full">
              {tNav("requestQuote")}
            </Link>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {quickLinks.map(({ href, label, detail, Icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="flex h-full flex-col gap-1 rounded-lg border border-line p-3 hover:border-brand-green-700 hover:bg-brand-green-50"
                  >
                    <Icon className="text-brand-green-700" />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="truncate text-xs text-muted">{detail}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <nav aria-label={tNav("label")} className="mt-6">
            <ul className="divide-y divide-line border-y border-line">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={close}
                    className="flex items-center justify-between px-1 py-3.5 text-lg font-semibold hover:text-brand-green-700"
                  >
                    {l.label}
                    <ChevronRightIcon className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 px-1 text-xs font-semibold tracking-wide text-muted uppercase">{categoriesLabel}</h3>
            <ul className="mt-2 grid gap-1">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={{ pathname: "/proizvodi", query: { kategorija: c.slug } }}
                    onClick={close}
                    className="block rounded-md px-3 py-2.5 hover:bg-brand-green-50"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby={`${titleId}-contact`} className="mt-6 rounded-lg bg-surface p-4">
            <h3 id={`${titleId}-contact`} className="text-xs font-semibold tracking-wide text-muted uppercase">
              {tNav("contactInfo")}
            </h3>
            <address className="mt-3 space-y-2 text-sm not-italic text-muted">
              <p className="flex gap-2">
                <MapPinIcon className="mt-0.5 shrink-0" />
                <span>
                  {site.address.street}, {site.address.postalCode} {site.address.city}
                </span>
              </p>
              {site.phones.map((p) => (
                <p key={p.href} className="flex gap-2">
                  <PhoneIcon className="mt-0.5 shrink-0" />
                  <a href={p.href} className="hover:text-ink hover:underline">
                    {p.display}
                  </a>
                </p>
              ))}
              <p className="flex gap-2">
                <MailIcon className="mt-0.5 shrink-0" />
                <a href={`mailto:${site.email}`} className="break-all hover:text-ink hover:underline">
                  {site.email}
                </a>
              </p>
            </address>
          </section>

          {site.social.length > 0 && (
            <section aria-labelledby={`${titleId}-social`} className="mt-6">
              <h3 id={`${titleId}-social`} className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">
                {tNav("followUs")}
              </h3>
              <ul className="mt-3 flex gap-2">
                {site.social.map(({ network, href }) => {
                  const Icon = socialIcons[network];
                  return (
                    <li key={href}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={socialNames[network]}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-line hover:border-brand-green-700 hover:bg-brand-green-50"
                      >
                        <Icon />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-line px-1 pt-4">
            <span className="text-sm text-muted">{t("language")}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("openMenu")}
        onClick={() => setOpenedOn(pathname)}
        className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface"
      >
        <MenuIcon width={24} height={24} />
      </button>
      {mounted && createPortal(panel, document.body)}
    </div>
  );
}
