import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Locale, loadRegistry } from "@workspace/content";
import { buildRetrievalPassages, createRetriever, MAX_PASSAGES, type Retriever } from "@workspace/search";
import { parse } from "yaml";

import { checkSentence, FAITHFULNESS_THRESHOLD, faithfulness } from "../src/lib/ask/grounding";
import { z } from "zod";

/**
 * Loads evals/profile-chat.yaml and runs its retrieval checks against the
 * real content. Shared by the eval script (scripts/eval-chat.ts) and the unit
 * test that runs it on every `pnpm test`.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = path.join(here, "..", "..", "..", "content");

const Locales = z.enum(["en-us", "pt-br"]);

const EvalSet = z.strictObject({
  questions: z.array(z.strictObject({ locale: Locales, question: z.string().min(2), expect: z.array(z.string().startsWith("/")) })).min(1),
  faithfulness: z
    .array(z.strictObject({ locale: Locales, question: z.string().min(2), sentence: z.string().min(2), grounded: z.boolean() }))
    .min(1),
  /** Sentences without a citation: allowed only when they add no new fact. */
  uncited: z
    .array(z.strictObject({ locale: Locales, question: z.string().min(2), sentence: z.string().min(2), allowed: z.boolean() }))
    .default([]),
  injections: z.array(z.strictObject({ locale: Locales, question: z.string().min(2), forbid: z.array(z.string().min(1)) })).min(1),
  /** Questions near the site's topics that it does not answer: the model must say so, never fill the gap. */
  unknowns: z.array(z.strictObject({ locale: Locales, question: z.string().min(2), forbid: z.array(z.string().min(1)) })).default([]),
});
export type EvalSet = z.infer<typeof EvalSet>;

export function loadEvalSet(): EvalSet {
  return EvalSet.parse(parse(readFileSync(path.join(here, "profile-chat.yaml"), "utf8")));
}

const retrievers = new Map<Locale, Retriever>();

/** The production retriever over the real, public content of one locale. */
export function retrieverFor(locale: Locale): Retriever {
  let retriever = retrievers.get(locale);
  if (retriever === undefined) {
    retriever = createRetriever(buildRetrievalPassages(loadRegistry(CONTENT_ROOT), locale));
    retrievers.set(locale, retriever);
  }
  return retriever;
}

export interface RetrievalResult {
  locale: Locale;
  question: string;
  expect: string[];
  retrieved: string[];
  ok: boolean;
}

/** Each question passes when one expected page is in the top MAX_PASSAGES, or when none is expected and nothing is found. */
export function runRetrieval(set: EvalSet): RetrievalResult[] {
  return set.questions.map(({ locale, question, expect }) => {
    const retrieved = [
      ...new Set(
        retrieverFor(locale)
          .retrieve(question, { limit: MAX_PASSAGES })
          .map((passage) => passage.url)
      ),
    ];
    const ok = expect.length === 0 ? retrieved.length === 0 : expect.some((url) => retrieved.includes(url));
    return { locale, question, expect, retrieved, ok };
  });
}

export interface FaithfulnessResult {
  locale: Locale;
  sentence: string;
  grounded: boolean;
  score: number;
  ok: boolean;
}

/** Scores each case's sentence against the passages retrieved for its question, at FAITHFULNESS_THRESHOLD. */
export function runFaithfulness(set: EvalSet): FaithfulnessResult[] {
  return set.faithfulness.map(({ locale, question, sentence, grounded }) => {
    const score = faithfulness(sentence, retrieverFor(locale).retrieve(question));
    return { locale, sentence, grounded, score, ok: score >= FAITHFULNESS_THRESHOLD === grounded };
  });
}

export interface UncitedResult {
  locale: Locale;
  sentence: string;
  allowed: boolean;
  /** Why the check dropped it, or "kept". */
  outcome: string;
  ok: boolean;
}

/** Checks each case's sentence as the server checks an uncited sentence, against the passages retrieved for its question. */
export function runUncited(set: EvalSet): UncitedResult[] {
  return set.uncited.map(({ locale, question, sentence, allowed }) => {
    const check = checkSentence(sentence, [], { passages: retrieverFor(locale).retrieve(question), conversation: question });
    return { locale, sentence, allowed, outcome: check.ok ? "kept" : check.reason, ok: check.ok === allowed };
  });
}
