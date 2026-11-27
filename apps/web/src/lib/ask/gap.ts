/**
 * An answer that covers only part of the question (ADR 0011, 2026-11-27
 * revision). The free models say so in their JSON (`incomplete`). Claude
 * cannot: its citations rule out structured outputs. So its prompt asks it to
 * end such an answer with a fixed marker line, which the server strips before
 * any check and turns into the same signal.
 *
 * Either way, the answer then ends with a fixed sentence, in the answer's
 * language, saying the site does not cover the rest, and is marked partial.
 * The sentence is the site's, not the model's: it names nothing, so it cannot
 * carry a fact past the checks.
 */

/** The line Claude writes after an answer that covers only part of the question. */
export const GAP_MARKER = "[[incomplete]]";

/** The marker, tolerant of spacing and case; global, so every copy goes. */
const MARKER = /\[\[\s*incomplete\s*\]\]/gi;

/** The text without the marker, and whether it had one. */
export function takeGapMarker(text: string): { text: string; found: boolean } {
  const stripped = text.replace(MARKER, "");
  return { text: stripped, found: stripped !== text };
}

/** The answer's closing sentence when the site covers only part of the question. zh-cn answers are in English (prompt.ts). */
export function siteDoesNotSay(locale: string): string {
  return locale === "pt-br"
    ? "Sobre o resto da pergunta, o site não diz nada."
    : "The site doesn't say anything about the rest of the question.";
}
