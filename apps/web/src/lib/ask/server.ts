import "server-only";

import { checkRateLimit } from "@vercel/firewall";
import type { Locale } from "@workspace/content";
import { buildRetrievalPassages, createRetriever, type Passage, type Retriever } from "@workspace/search";

import { getContent } from "@/lib/content";

/** The Vercel WAF rule this route checks (ADR 0011 has its settings). */
export const RATE_LIMIT_ID = "profile-chat";

const sites = new Map<string, { passages: readonly Passage[]; retriever: Retriever }>();

/** Every public passage of a locale and its index, built on first use from the public registry. */
function site(locale: Locale) {
  if (process.env.NODE_ENV === "development") {
    const passages = buildRetrievalPassages(getContent(), locale);
    return { passages, retriever: createRetriever(passages) };
  }
  let built = sites.get(locale);
  if (built === undefined) {
    const passages = buildRetrievalPassages(getContent(), locale);
    built = { passages, retriever: createRetriever(passages) };
    sites.set(locale, built);
  }
  return built;
}

/** The keyword index of a locale: the free models' passages, and the pages an answer is most about. */
export function getRetriever(locale: Locale): Retriever {
  return site(locale).retriever;
}

/** The whole public site of a locale as passages, in a stable order: Claude reads all of it (ADR 0011). */
export function getSitePassages(locale: Locale): readonly Passage[] {
  return site(locale).passages;
}

let warned = false;
function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[ask] ${message}`);
}

/**
 * Asks the Vercel firewall whether this visitor is over the profile-chat
 * limit. Off Vercel (local, CI, e2e) there is no firewall to ask; a missing
 * rule or an unreachable firewall counts as allowed, logged once.
 */
export async function isRateLimited(request: Request): Promise<boolean> {
  if (process.env.VERCEL !== "1") return false;
  try {
    const { rateLimited, error } = await checkRateLimit(RATE_LIMIT_ID, { request, timeout: 1500 });
    if (error === "not-found") warnOnce(`WAF rule "${RATE_LIMIT_ID}" is not configured; requests are not rate limited`);
    return rateLimited;
  } catch {
    warnOnce("the rate-limit check failed; requests are allowed");
    return false;
  }
}
