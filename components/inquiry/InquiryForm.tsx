"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitInquiry } from "@/lib/inquiry/action";
import type { InquiryField, InquirySource, InquiryState } from "@/lib/inquiry/schema";
import { site } from "@/lib/site";
import { CheckIcon } from "@/components/icons";

type Props = {
  source: InquirySource;
  /** Product context (slug + display name) for product inquiries. */
  product?: { slug: string; name: string };
  /** Search query for search-miss inquiries. */
  query?: string;
  /** id of the <form>, so variant chips elsewhere on the page can join it via the `form` attribute. */
  formId?: string;
};

const initialState: InquiryState = { status: "idle" };

export function InquiryForm({ source, product, query, formId }: Props) {
  const t = useTranslations("Inquiry");
  const locale = useLocale();
  const generatedId = useId();
  const id = formId ?? `inquiry-${generatedId}`;
  const startedAt = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);

  const firstSeen = useRef(0);

  // Set client-side so the timestamp reflects when the visitor first saw the form; restored
  // after every submission because React resets uncontrolled form fields after an action.
  useEffect(() => {
    firstSeen.current ||= Date.now();
    if (startedAt.current) startedAt.current.value = String(firstSeen.current);
  }, [state]);

  if (state.status === "success") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-brand-green bg-brand-green-50 p-5">
        <CheckIcon className="mt-0.5 shrink-0 text-brand-green-700" />
        <p className="font-medium">{t("success")}</p>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};
  const defaultMessage =
    source === "product" && product
      ? t("defaultProductMessage", { product: product.name })
      : source === "search_miss" && query
        ? t("defaultSearchMessage", { query })
        : "";

  const field = (name: InquiryField) => {
    const error = fieldErrors[name];
    return {
      id: `${id}-${name}`,
      name,
      defaultValue: values[name],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${id}-${name}-error` : undefined,
      className: `mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 ${
        error ? "border-red-700" : "border-line"
      } focus:border-brand-blue`,
    };
  };
  const errorText = (name: InquiryField) =>
    fieldErrors[name] ? (
      <p id={`${id}-${name}-error`} className="mt-1 text-sm text-red-700">
        {t(`errors.${fieldErrors[name]}` as "errors.required")}
      </p>
    ) : null;
  const optional = <span className="font-normal text-muted"> ({t("optional")})</span>;

  return (
    <form id={id} action={formAction} noValidate className="space-y-4">
      {state.status === "error" && (
        <div role="alert" className="rounded-lg border border-red-700 bg-red-50 p-3 text-sm text-red-800">
          {state.error === "sendFailed"
            ? t("errors.sendFailed", { phone: site.phones[0].display, email: site.email })
            : t(`errors.${state.error}`)}
        </div>
      )}

      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="startedAt" ref={startedAt} defaultValue="" />
      {product && <input type="hidden" name="product" value={product.slug} />}
      {query && <input type="hidden" name="query" value={query} />}

      {/* Honeypot – hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {product && (
        <p className="rounded-lg bg-surface px-3 py-2 text-sm">
          <span className="font-semibold">{t("product")}:</span> {product.name}
        </p>
      )}
      {query && (
        <p className="rounded-lg bg-surface px-3 py-2 text-sm">
          <span className="font-semibold">{t("searchQuery")}:</span> {query}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-semibold">
            {t("name")}
          </label>
          <input {...field("name")} type="text" autoComplete="name" required />
          {errorText("name")}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="text-sm font-semibold">
            {t("email")}
          </label>
          <input {...field("email")} type="email" autoComplete="email" required />
          {errorText("email")}
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="text-sm font-semibold">
            {t("phone")}
            {optional}
          </label>
          <input {...field("phone")} type="tel" autoComplete="tel" />
          {errorText("phone")}
        </div>
        <div>
          <label htmlFor={`${id}-company`} className="text-sm font-semibold">
            {t("company")}
            {optional}
          </label>
          <input {...field("company")} type="text" autoComplete="organization" />
          {errorText("company")}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="text-sm font-semibold">
          {t("message")}
        </label>
        <textarea {...field("message")} defaultValue={values.message ?? defaultMessage} rows={5} required />
        {errorText("message")}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-70">
          {pending ? t("sending") : t("submit")}
        </button>
        <p className="text-sm text-muted">{t("privacy")}</p>
      </div>
    </form>
  );
}
