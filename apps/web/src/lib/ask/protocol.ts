/**
 * The profile chat's wire format (ADR 0011), shared by POST /api/ask and the
 * Ask panel. Safe to import client-side: types and limits only.
 *
 * The response is NDJSON, one event per line, in this order:
 *   status → (text | cite)* → sources → done
 * An `error` event may replace the rest when the model fails mid-answer.
 */

/** Longest question accepted, in characters. */
export const MAX_QUESTION = 300;
/** Earlier turns sent with a question; older ones are dropped. */
export const MAX_HISTORY = 3;
/** Longest earlier answer kept in the history, in characters. */
export const MAX_HISTORY_ANSWER = 1500;

export interface AskTurn {
  question: string;
  answer: string;
}

export interface AskRequest {
  locale: string;
  question: string;
  history?: AskTurn[];
}

/**
 * How the answer is made:
 * - `model`: written by a model from the retrieved passages, every sentence
 *   checked against the passages it cites;
 * - `extractive`: the best matching passages, quoted, no model (no key, rate
 *   limited, the model failed, or nothing it wrote passed the checks);
 * - `no-source`: nothing on the site matches, so nothing is answered.
 */
export type AskMode = "model" | "extractive" | "no-source";
export type FallbackReason = "unavailable" | "rate-limited" | "error" | "ungrounded";

export interface AskSource {
  /** Citation number shown in the answer, or null for a related page the answer did not cite. */
  n: number | null;
  title: string;
  /** Locale-prefixed path of the page. */
  url: string;
  /** The passage text, for extractive answers. */
  excerpt?: string;
}

export type AskEvent =
  | { type: "status"; mode: AskMode; reason?: FallbackReason }
  | { type: "text"; text: string }
  | { type: "cite"; n: number }
  | { type: "sources"; sources: AskSource[] }
  | { type: "error" }
  | { type: "done" };
