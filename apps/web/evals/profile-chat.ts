import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Locale, loadRegistry, localize } from "@workspace/content";
import { buildRetrievalPassages, createRetriever, MAX_PASSAGES, type Passage, type Retriever } from "@workspace/search";
import { parse } from "yaml";

import { asRetrieved, focusPassages } from "../src/lib/ask/engine";
import { checkSentence, FAITHFULNESS_THRESHOLD, faithfulness } from "../src/lib/ask/grounding";
import { isOffTopic } from "../src/lib/ask/off-topic";
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
  /**
   * Questions that name nothing the search can match ("who is Victor?").
   * Claude reads the whole site, so the model must answer and cite one of
   * `expect`; offline, the free models' pages (the search's, plus the
   * profile when it finds too little) must include one of `expect`.
   */
  vague: z
    .array(z.strictObject({ locale: Locales, question: z.string().min(2), expect: z.array(z.string().startsWith("/")).min(1) }))
    .default([]),
  faithfulness: z
    .array(z.strictObject({ locale: Locales, question: z.string().min(2), sentence: z.string().min(2), grounded: z.boolean() }))
    .min(1),
  /** Sentences without a citation: allowed only when they add no new fact. */
  uncited: z
    .array(z.strictObject({ locale: Locales, question: z.string().min(2), sentence: z.string().min(2), allowed: z.boolean() }))
    .default([]),
  injections: z.array(z.strictObject({ locale: Locales, question: z.string().min(2), forbid: z.array(z.string().min(1)) })).min(1),
  /**
   * First questions and whether they are off topic (off-topic.ts): an off-topic
   * one gets a fixed reply with no model call, so a vague question about the
   * owner must never be one.
   */
  offTopic: z.array(z.strictObject({ locale: Locales, question: z.string().min(2), offTopic: z.boolean() })).default([]),
  /** Questions near the site's topics that it does not answer: the model must say so, never fill the gap. */
  unknowns: z.array(z.strictObject({ locale: Locales, question: z.string().min(2), forbid: z.array(z.string().min(1)) })).default([]),
});
export type EvalSet = z.infer<typeof EvalSet>;

export function loadEvalSet(): EvalSet {
  return EvalSet.parse(parse(readFileSync(path.join(here, "profile-chat.yaml"), "utf8")));
}

const sites = new Map<Locale, { passages: readonly Passage[]; retriever: Retriever }>();

function site(locale: Locale) {
  let built = sites.get(locale);
  if (built === undefined) {
    const passages = buildRetrievalPassages(loadRegistry(CONTENT_ROOT), locale);
    built = { passages, retriever: createRetriever(passages) };
    sites.set(locale, built);
  }
  return built;
}

/** The production retriever over the real, public content of one locale. */
export function retrieverFor(locale: Locale): Retriever {
  return site(locale).retriever;
}

/** Every public passage of one locale, as the chat route hands them to Claude. */
export function siteFor(locale: Locale): readonly Passage[] {
  return site(locale).passages;
}

/** The pages a vague question's free-model answer would read: the search's, plus the profile when it finds too little. */
export function runVague(set: EvalSet): RetrievalResult[] {
  return set.vague.map(({ locale, question, expect }) => {
    const focus = focusPassages(retrieverFor(locale).retrieve(question, { limit: MAX_PASSAGES }), siteFor(locale).map(asRetrieved));
    const retrieved = [...new Set(focus.map((passage) => passage.url))];
    return { locale, question, expect, retrieved, ok: expect.some((url) => retrieved.includes(url)) };
  });
}

export interface OffTopicResult {
  locale: Locale;
  question: string;
  offTopic: boolean;
  ok: boolean;
}

/** Each first question is classified with the production retriever, as the chat route does before calling a model. */
export function runOffTopic(set: EvalSet): OffTopicResult[] {
  return set.offTopic.map(({ locale, question, offTopic }) => {
    const found = retrieverFor(locale).retrieve(question);
    return { locale, question, offTopic, ok: isOffTopic(question, found, 0) === offTopic };
  });
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

/** Every position's title in one locale, and whether it has ended. */
function positionTitles(locale: Locale): { title: string; past: boolean }[] {
  return loadRegistry(CONTENT_ROOT)
    .getExperiences()
    .flatMap((experience) =>
      experience.positions.map((position) => ({ title: localize(position.title, locale).value, past: position.end !== undefined }))
    );
}

/** Lower case, no accents: "Analista" and "analista" are the same title. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Deterministic wording checks on a model answer (2026-11-27, after answers
 * said the same role twice and put a past role in the present):
 * - a position title written more than once;
 * - in Portuguese, an ended position introduced with "trabalho como"
 *   ("Antes disso, trabalho como Estagiário…").
 * Titles are matched whole and case-insensitively, so a shared word ("Desenvolvedor") never counts,
 * and neither does a title inside a longer one ("AI software developer" in "AI software developer intern"):
 * those are two roles.
 */
export function wordingIssues(text: string, locale: Locale): string[] {
  const answer = fold(text);
  const issues: string[] = [];
  const titles = positionTitles(locale);
  // A title's part before its comma counts too: answers write "AI software developer intern in the Superintendence".
  const folded = [...new Set(titles.flatMap(({ title }) => [fold(title), fold(title.split(",")[0] ?? title)]))];
  for (const { title, past } of titles) {
    const needle = fold(title);
    if (needle.length < 8) continue;
    const longer = folded.filter((other) => other.length > needle.length && other.includes(needle));
    const own = longer.reduce((rest, other) => rest.split(other).join(" "), answer);
    const count = own.split(needle).length - 1;
    if (count > 1) issues.push(`repeats "${title}"`);
    if (locale === "pt-br" && past && answer.includes(`trabalho como ${needle}`)) issues.push(`present tense for past "${title}"`);
  }
  return [...new Set(issues)];
}
