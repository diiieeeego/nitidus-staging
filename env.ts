import { randomBytes } from "node:crypto";
import { z } from "zod";

/**
 * Server environment, validated once at startup and during `next build`
 * (imported by next.config.ts) – an invalid variable fails the build.
 * Never import this from Client Components.
 */
const schema = z
  .object({
    /**
     * "smtp" sends mail (SMTP_* required); "log" prints inquiries to the server console (local only);
     * "disabled" sends nothing – the form shows the phone/email fallback. When unset: "smtp" if all
     * SMTP_* variables are present, otherwise "disabled".
     */
    MAIL_TRANSPORT: z.enum(["smtp", "log", "disabled"]).optional(),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    /** Sender shown in the inquiry email, e.g. "Nitidus web <web@nitidus.hr>". */
    SMTP_FROM: z.string().min(3).optional(),
    INQUIRY_EMAIL: z.email().default("nitidusdoo@gmail.com"),
    /**
     * Salt for hashing visitor IPs (rate limiting); at least 16 characters. Optional: the rate limit
     * is per instance and in memory, so a random per-process salt works just as well.
     */
    IP_HASH_SALT: z.string().min(16).default(() => randomBytes(24).toString("hex")),
    /** Public origin, e.g. https://nitidus.hr (falls back to the Vercel production URL). */
    SITE_URL: z.url().optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  })
  .transform((env) => ({
    ...env,
    MAIL_TRANSPORT:
      env.MAIL_TRANSPORT ??
      (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM ? ("smtp" as const) : ("disabled" as const)),
  }))
  .superRefine((env, ctx) => {
    if (env.MAIL_TRANSPORT === "smtp") {
      for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const) {
        if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "required when MAIL_TRANSPORT=smtp" });
      }
    }
    if (env.MAIL_TRANSPORT === "log" && env.VERCEL_ENV === "production") {
      ctx.addIssue({ code: "custom", path: ["MAIL_TRANSPORT"], message: "\"log\" is not allowed in production" });
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables (see .env.example):\n${details}`);
}

export const env = parsed.data;

if (env.MAIL_TRANSPORT === "disabled") {
  console.warn("[env] SMTP is not configured – inquiry emails are disabled (MAIL_TRANSPORT=disabled).");
}
