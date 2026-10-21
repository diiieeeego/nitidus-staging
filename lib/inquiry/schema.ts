import { z } from "zod";
import { locales } from "@/lib/catalog/schema";

/** Shared by the form (client) and the Server Action. Messages are keys under `Inquiry.errors`. */
export const inquirySources = ["contact", "product", "search_miss"] as const;
export type InquirySource = (typeof inquirySources)[number];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .optional()
    .transform((v) => v || undefined);

export const inquirySchema = z.object({
  source: z.enum(inquirySources),
  locale: z.enum(locales),
  name: z.string().trim().min(2, "required").max(100, "tooLong"),
  email: z.string().trim().max(200, "tooLong").pipe(z.email("email")),
  phone: optionalText(40),
  company: optionalText(120),
  message: z.string().trim().min(10, "tooShort").max(4000, "tooLong"),
  product: optionalText(200),
  variant: optionalText(200),
  query: optionalText(80),
});

export type Inquiry = z.infer<typeof inquirySchema>;
export type InquiryField = keyof Inquiry;

export type InquiryState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      error: "invalid" | "tooFast" | "rateLimited" | "sendFailed";
      fieldErrors?: Partial<Record<InquiryField, string>>;
      values?: Partial<Record<InquiryField, string>>;
    };

/** Minimum time between rendering the form and submitting it (bots submit instantly). */
export const MIN_FILL_MS = 3000;
