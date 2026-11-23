import { normalizeTerm, type RetrievedPassage } from "@workspace/search";

import type { AskSource } from "./protocol";

/** Source cards under an answer: at least this many when there are, at most the other. */
export const MIN_CARDS = 3;
export const MAX_CARDS = 5;

/**
 * Turns the API's citations into numbered source cards. Passages are sent as
 * `search_result` blocks in retrieval order, so a citation's
 * `search_result_index` is the passage's position; several passages of one
 * page share one number, in the order the answer first cites them.
 */
export class CitationMap {
  private readonly numbers = new Map<string, number>();

  constructor(private readonly passages: readonly RetrievedPassage[]) {}

  /** The card number for a cited passage, or undefined when the index is unknown. */
  cite(searchResultIndex: number): number | undefined {
    const passage = this.passages[searchResultIndex];
    if (passage === undefined) return undefined;
    let n = this.numbers.get(passage.url);
    if (n === undefined) {
      n = this.numbers.size + 1;
      this.numbers.set(passage.url, n);
    }
    return n;
  }

  /**
   * Cited pages first, by number; then the best uncited pages as related
   * (n: null) until there are MIN_CARDS; never more than MAX_CARDS.
   */
  sources(): AskSource[] {
    const byUrl = uniqueByUrl(this.passages);
    const cited = [...this.numbers.entries()]
      .sort(([, a], [, b]) => a - b)
      .flatMap(([url, n]) => {
        const passage = byUrl.get(url);
        return passage ? [{ n, title: pageTitle(passage), url }] : [];
      });
    const related = [...byUrl.values()]
      .filter((passage) => !this.numbers.has(passage.url))
      .slice(0, Math.max(0, MIN_CARDS - cited.length))
      .map((passage) => ({ n: null, title: pageTitle(passage), url: passage.url }));
    return [...cited, ...related].slice(0, MAX_CARDS);
  }
}

/** Best passage per page, in retrieval order. */
function uniqueByUrl(passages: readonly RetrievedPassage[]): Map<string, RetrievedPassage> {
  const byUrl = new Map<string, RetrievedPassage>();
  for (const passage of passages) if (!byUrl.has(passage.url)) byUrl.set(passage.url, passage);
  return byUrl;
}

/** A post chunk's title carries its section ("Post › Section"); the card names the page. */
function pageTitle(passage: RetrievedPassage): string {
  return passage.type === "post" ? (passage.title.split(" › ")[0] ?? passage.title) : passage.title;
}

const EXCERPT_LENGTH = 220;

/**
 * The sentences of a passage that match the most query terms, in their
 * original order, up to about EXCERPT_LENGTH characters.
 */
export function excerpt(passage: RetrievedPassage, length = EXCERPT_LENGTH): string {
  const sentences = passage.text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== "");
  const terms = passage.terms.map(normalizeTerm);
  const scored = sentences.map((sentence, index) => {
    const words = normalizeTerm(sentence);
    return { index, sentence, score: terms.filter((term) => words.includes(term)).length };
  });
  const picked: typeof scored = [];
  let total = 0;
  for (const candidate of [...scored].sort((a, b) => b.score - a.score || a.index - b.index)) {
    if (picked.length > 0 && total + candidate.sentence.length > length) continue;
    picked.push(candidate);
    total += candidate.sentence.length + 1;
    if (total >= length) break;
  }
  const text = picked
    .sort((a, b) => a.index - b.index)
    // Lines without a full stop (list items) would run together; close them.
    .map((candidate) => (/[.!?…:;]$/.test(candidate.sentence) ? candidate.sentence : `${candidate.sentence}.`))
    .join(" ");
  return text.length > length + 40 ? `${text.slice(0, length).trimEnd()}…` : text;
}

/** The extractive answer: one card per page, each with its best passage quoted. */
export function extractiveSources(passages: readonly RetrievedPassage[], limit = 4): AskSource[] {
  return [...uniqueByUrl(passages).values()].slice(0, limit).map((passage, index) => ({
    n: index + 1,
    title: pageTitle(passage),
    url: passage.url,
    excerpt: excerpt(passage),
  }));
}
