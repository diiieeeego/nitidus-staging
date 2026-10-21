import "server-only";

import { activeProducts, pick, toCard, type ProductCard } from "./index";
import { locales, type Locale } from "./schema";

/**
 * In-memory catalog search (no database). Diacritic- and case-insensitive,
 * typo-tolerant via trigram similarity. Ranking: exact SKU > SKU prefix >
 * name matches > description/category matches.
 */

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 80;

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function trigrams(word: string): Set<string> {
  const padded = `  ${word} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

/** Jaccard similarity of trigram sets (same idea as pg_trgm's similarity()). */
export function similarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

type Entry = {
  slug: string;
  sku: string; // normalized, without spaces
  nameWords: string[];
  otherWords: string[];
};

const indexes = new Map<Locale, Entry[]>();

function getIndex(locale: Locale): Entry[] {
  let index = indexes.get(locale);
  if (!index) {
    index = activeProducts().map((p) => ({
      slug: p.slug,
      sku: normalize(p.sku ?? "").replace(/ /g, ""),
      nameWords: normalize(pick(p.name, locale)).split(" ").filter(Boolean),
      otherWords: normalize(
        [pick(p.short_description, locale), ...p.variants.map((v) => pick(v.label, locale)), p.category].join(" "),
      )
        .split(" ")
        .filter(Boolean),
    }));
    indexes.set(locale, index);
  }
  return index;
}

/** Best match quality of one query token against a word list (0 = no match). */
function tokenScore(token: string, words: string[]): number {
  let best = 0;
  for (const w of words) {
    if (w === token) return 3;
    if (w.startsWith(token)) best = Math.max(best, 2.2);
    else if (token.length >= 3 && w.includes(token)) best = Math.max(best, 1.5);
    else if (token.length >= 4) {
      const sim = similarity(token, w);
      if (sim >= 0.4) best = Math.max(best, sim * 1.5);
    }
  }
  return best;
}

export function searchProducts(query: string, locale: Locale, limit = 20): ProductCard[] {
  const q = normalize(query).slice(0, SEARCH_MAX_LENGTH);
  if (q.length < SEARCH_MIN_LENGTH) return [];
  const tokens = q.split(" ");
  const compact = q.replace(/ /g, "");

  const scored: { slug: string; score: number }[] = [];
  for (const e of getIndex(locale)) {
    let score = 0;
    if (e.sku && e.sku === compact) score += 1000;
    else if (e.sku && compact.length >= 2 && e.sku.startsWith(compact)) score += 500;

    let allTokensMatch = true;
    for (const t of tokens) {
      const s = Math.max(tokenScore(t, e.nameWords) * 2, tokenScore(t, e.otherWords));
      if (s === 0) allTokensMatch = false;
      score += s;
    }
    if (score >= 500 || (allTokensMatch && score > 0)) {
      if (e.nameWords.join(" ").startsWith(q)) score += 5;
      scored.push({ slug: e.slug, score });
    }
  }

  const bySlug = new Map(activeProducts().map((p) => [p.slug, p]));
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => toCard(bySlug.get(s.slug)!, locale));
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
