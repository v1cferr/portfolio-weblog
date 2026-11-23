import "server-only";

import { checkRateLimit } from "@vercel/firewall";
import type { Locale } from "@workspace/content";
import { buildRetrievalPassages, createRetriever, type Retriever } from "@workspace/search";

import { getContent } from "@/lib/content";

/** The Vercel WAF rule this route checks (ADR 0011 has its settings). */
export const RATE_LIMIT_ID = "profile-chat";

const retrievers = new Map<string, Retriever>();

/** One index per locale, built on first use from the public registry. */
export function getRetriever(locale: Locale): Retriever {
  if (process.env.NODE_ENV === "development") return createRetriever(buildRetrievalPassages(getContent(), locale));
  let retriever = retrievers.get(locale);
  if (retriever === undefined) {
    retriever = createRetriever(buildRetrievalPassages(getContent(), locale));
    retrievers.set(locale, retriever);
  }
  return retriever;
}

export { getClient } from "./anthropic";

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
