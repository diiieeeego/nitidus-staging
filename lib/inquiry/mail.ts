import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/env";
import type { Inquiry } from "./schema";

const SUBJECT_PREFIX: Record<Inquiry["source"], string> = {
  contact: "[Upit] Kontakt",
  product: "[Upit za proizvod]",
  search_miss: "[Pretraga bez rezultata]",
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

let transport: Transporter | null = null;
function getTransport() {
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transport;
}

export async function sendInquiryMail(inquiry: Inquiry, context: { productLabel?: string; productUrl?: string }) {
  const topic =
    inquiry.source === "product"
      ? (context.productLabel ?? inquiry.product ?? "")
      : inquiry.source === "search_miss"
        ? `„${inquiry.query ?? ""}”`
        : inquiry.name;
  const subject = `${SUBJECT_PREFIX[inquiry.source]} ${topic}`.trim().slice(0, 200);

  const rows: [string, string | undefined][] = [
    ["Izvor", inquiry.source],
    ["Ime", inquiry.name],
    ["E-mail", inquiry.email],
    ["Telefon", inquiry.phone],
    ["Tvrtka", inquiry.company],
    ["Proizvod", context.productLabel],
    ["Link", context.productUrl],
    ["Varijanta", inquiry.variant],
    ["Traženi pojam", inquiry.query],
    ["Jezik", inquiry.locale],
  ];
  const filled = rows.filter((r): r is [string, string] => !!r[1]);
  const text = `${filled.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${inquiry.message}\n`;
  const html =
    `<table cellpadding="4">${filled
      .map(([k, v]) => `<tr><th align="left">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
      .join("")}</table>` + `<p style="white-space:pre-wrap">${escapeHtml(inquiry.message)}</p>`;

  if (env.MAIL_TRANSPORT === "log") {
    console.info(`[inquiry:log] to=${env.INQUIRY_EMAIL} reply-to=${inquiry.email}\nSubject: ${subject}\n${text}`);
    return;
  }

  await getTransport().sendMail({
    from: env.SMTP_FROM,
    to: env.INQUIRY_EMAIL,
    replyTo: { name: inquiry.name, address: inquiry.email },
    subject,
    text,
    html,
  });
}
