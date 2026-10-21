"use server";

import { headers } from "next/headers";
import { getProduct } from "@/lib/catalog";
import { siteUrl } from "@/lib/seo";
import { sendInquiryMail } from "./mail";
import { allowInquiry, hashIp } from "./rate-limit";
import { inquirySchema, MIN_FILL_MS, type InquiryField, type InquiryState } from "./schema";

const FIELDS: InquiryField[] = ["source", "locale", "name", "email", "phone", "company", "message", "product", "variant", "query"];

/** Single Server Action for all inquiry sources (contact | product | search_miss). Nothing is stored. */
export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const raw = Object.fromEntries(FIELDS.map((f) => [f, formData.get(f)?.toString() ?? undefined]));
  // Variant chips on the product page submit colour and size separately.
  const variantParts = [formData.get("variantColor"), formData.get("variantSize")].filter(Boolean).map(String);
  if (variantParts.length) raw.variant = variantParts.join(", ");
  const values = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined)) as Partial<
    Record<InquiryField, string>
  >;

  // Honeypot: real users never see this field. Pretend success so bots don't retry.
  if (formData.get("website")) return { status: "success" };

  const startedAt = Number(formData.get("startedAt"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "error", error: "tooFast", values };
  }

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<InquiryField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as InquiryField;
      fieldErrors[field] ??= issue.message;
    }
    return { status: "error", error: "invalid", fieldErrors, values };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!allowInquiry(hashIp(ip))) {
    return { status: "error", error: "rateLimited", values };
  }

  const inquiry = parsed.data;
  const product = inquiry.product ? getProduct(inquiry.product, "hr") : null;
  try {
    await sendInquiryMail(inquiry, {
      productLabel: product ? `${product.name}${product.sku ? ` (${product.sku})` : ""}` : inquiry.product,
      productUrl: product ? `${siteUrl()}/hr/proizvodi/${product.slug}` : undefined,
    });
  } catch (err) {
    // Without a database the email is the only record, so the visitor must know it failed.
    console.error(`[inquiry] sending failed (source=${inquiry.source}):`, err instanceof Error ? err.message : err);
    return { status: "error", error: "sendFailed", values };
  }
  return { status: "success" };
}
