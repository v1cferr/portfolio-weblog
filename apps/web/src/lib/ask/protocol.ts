/**
 * The profile chat's wire format (ADR 0011), shared by POST /api/ask and the
 * Ask panel. Safe to import client-side: types and limits only.
 *
 * The response is NDJSON, one event per line, in this order:
 *   [reading → [checking]] → status → (text | cite)* → sources → done
 * `reading` comes only when a model is about to be asked: the pages it reads,
 * so the panel has something to show while the model thinks. `checking` comes
 * when the model has replied and its answer is about to be checked against
 * those pages (milliseconds): the panel shows it as a finished step, never a
 * live one.
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
 * - `unknown`: related pages were found, but the model read them and they do
 *   not answer the question, so the answer is "the site does not say";
 * - `no-source`: nothing on the site matches, so nothing is answered.
 */
export type AskMode = "model" | "extractive" | "unknown" | "no-source";
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
  /** `partial`: a model answer that covers only part of the question, said by the panel, not the model. */
  | { type: "status"; mode: AskMode; reason?: FallbackReason; partial?: true }
  | { type: "reading"; pages: { title: string; url: string }[] }
  | { type: "checking" }
  | { type: "text"; text: string }
  | { type: "cite"; n: number }
  | { type: "sources"; sources: AskSource[] }
  | { type: "error" }
  | { type: "done" };
