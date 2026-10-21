import "server-only";

import { createHash } from "node:crypto";
import { env } from "@/env";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

// Best-effort, per server instance (no database): on serverless each instance keeps
// its own window, so the effective limit can be higher under load. Honeypot and the
// minimum fill time catch most automated submissions before this.
const hits = new Map<string, number[]>();

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${env.IP_HASH_SALT}:${ip}`).digest("hex");
}

/** Records a hit and returns false when the hash exceeded the limit within the window. */
export function allowInquiry(ipHash: string, now = Date.now()): boolean {
  const recent = (hits.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ipHash, recent);
    return false;
  }
  recent.push(now);
  hits.set(ipHash, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
  return true;
}
