import MiniSearch from "minisearch";

import type { Passage } from "./passages";

/**
 * Keyword retrieval for the profile chat (ADR 0011): MiniSearch over the
 * passages of one locale, with the search index's boosts, but OR-combined
 * (a question is a sentence, not a filter) and with stop words and accents
 * dropped so "o que" or "what is" never count as a match.
 */

/** Most passages handed to the model or shown as the extractive answer. */
export const MAX_PASSAGES = 6;

/** Most passages from one document, so a long post cannot crowd out every other page. */
export const MAX_PER_DOCUMENT = 2;

/**
 * Lowest score the best passage needs. Below it there is no source, so there
 * is no answer: the model is not called. Tuned with the eval set
 * (apps/web/evals/profile-chat.yaml): one plain topic word ("Nix") scores
 * about 4, a nonsense or off-site question matches nothing at all.
 */
export const MIN_SCORE = 3;

/** Other passages must score at least this share of the best one, so a stray common word does not ride along. */
export const RELATIVE_FLOOR = 0.15;

/** Function words in the site's languages, plus words every question about the owner contains. */
const STOP_WORDS = new Set(
  // English
  (
    "a an and are as at be been but by can could did do does for from had has have he her him his how i if in into is it its " +
    "me my of on or our she so than that the their them then there these they this those to too us was we were what when " +
    "where which while who whom why will with would you your about any some tell know there's what's he's victor ferreira v1cferr " +
    "use uses used using did done does doing has have having get got " +
    // Portuguese (accents already stripped)
    "o os as um uma uns umas de do da dos das no na nos nas em ao aos por pelo pela pelos pelas para pra com sem sob " +
    "e ou mas que qual quais quem quando onde como porque por que se ele ela eles elas seu sua seus suas dele dela " +
    "eu voce voces nos me te lhe isso isto esse essa este esta aquele aquela ja ate mais muito muita ser estar foi " +
    "era sao esta estao tem ter teve fez faz sobre algum alguma alguns algumas qualquer usa usou usar fala diga sabe"
  ).split(/\s+/)
);

/** Lower case, without accents, so "não" and "nao" meet. */
export function normalizeTerm(term: string): string {
  return term
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * The words of a text that carry meaning: normalized, without stop words,
 * numbers kept, words shorter than three letters dropped. Used to check that
 * a generated sentence stays close to the passages it cites.
 */
export function contentWords(text: string): string[] {
  return (normalizeTerm(text).match(/[\p{L}\p{N}][\p{L}\p{N}+#.-]*[\p{L}\p{N}+#]|[\p{L}\p{N}]/gu) ?? []).filter(
    (word) => word.length >= 3 && !STOP_WORDS.has(word)
  );
}

function processTerm(term: string): string | null {
  const normalized = normalizeTerm(term);
  return normalized.length < 2 || STOP_WORDS.has(normalized) ? null : normalized;
}

export interface RetrievedPassage extends Passage {
  score: number;
  /** Query terms (normalized) that matched this passage. */
  terms: string[];
}

export interface Retriever {
  retrieve(question: string, options?: { limit?: number; minScore?: number }): RetrievedPassage[];
}

export function createRetriever(passages: readonly Passage[]): Retriever {
  const byId = new Map(passages.map((passage) => [passage.id, passage]));
  const index = new MiniSearch<Passage>({
    fields: ["title", "keywords", "text"],
    storeFields: [],
    processTerm,
    searchOptions: {
      boost: { title: 3, keywords: 2 },
      combineWith: "OR",
      // Short words are matched exactly; fuzzy and prefix matching on them turns noise into hits.
      prefix: (term) => term.length >= 4,
      fuzzy: (term) => (term.length >= 5 ? 0.2 : false),
    },
  });
  index.addAll([...passages]);

  return {
    retrieve(question, { limit = MAX_PASSAGES, minScore = MIN_SCORE } = {}) {
      const hits = index.search(question);
      const best = hits[0]?.score ?? 0;
      if (best < minScore) return [];
      const floor = best * RELATIVE_FLOOR;
      const perDocument = new Map<string, number>();
      const results: RetrievedPassage[] = [];
      for (const hit of hits) {
        if (hit.score < floor || results.length >= limit) break;
        const passage = byId.get(hit.id as string);
        if (passage === undefined) continue;
        const count = perDocument.get(passage.docId) ?? 0;
        if (count >= MAX_PER_DOCUMENT) continue;
        perDocument.set(passage.docId, count + 1);
        results.push({ ...passage, score: hit.score, terms: hit.terms });
      }
      return results;
    },
  };
}
