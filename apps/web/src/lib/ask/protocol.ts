/**
 * The profile chat's wire format (ADR 0011), shared by POST /api/ask and the
 * Ask panel. Safe to import client-side: types and limits only.
 *
 * The response is NDJSON, one event per line, in this order:
 *   [reading → [checking]] → status → (text | cite)* → [partial] → [suggestions] → sources → done
 * `reading` comes only when a model is about to be asked: the pages it reads,
 * so the panel has something to show while the model thinks. `checking` comes
 * right before the first checked sentence: every sentence is checked against
 * the pages before it is sent, so text arrives sentence by sentence and
 * unchecked text never does. `text` may carry light Markdown; `cite` follows
 * the sentence it backs. `partial` comes after the text when a sentence was
 * left out or the answer was cut, and `suggestions` offers follow-up
 * questions built from the related pages.
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
 * - `no-source`: nothing on the site matches, so nothing is answered;
 * - `small-talk`: a greeting, a thanks or "what can you do": a fixed reply
 *   from the site, no model and no retrieval, and the suggested questions.
 */
export type AskMode = "model" | "extractive" | "unknown" | "no-source" | "small-talk";
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
  | { type: "partial" }
  /** Follow-up questions the visitor can ask with one tap, built from the related pages. */
  | { type: "suggestions"; questions: string[] }
  | { type: "sources"; sources: AskSource[] }
  | { type: "error" }
  | { type: "done" };
