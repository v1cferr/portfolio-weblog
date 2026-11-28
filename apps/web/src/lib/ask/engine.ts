import { MAX_PASSAGES, type Passage, type Retriever, type RetrievedPassage } from "@workspace/search";

import { type ClaudeAnswer, ClaudeFailure } from "./anthropic";
import {
  ANSWER_SCHEMA,
  checkSentence,
  type Corpus,
  type DropReason,
  groundAnswer,
  isClaim,
  MAX_ANSWER_LENGTH,
  MAX_SENTENCES,
  parseModelAnswer,
  type PendingSentence,
  repeats,
  SentenceBuffer,
} from "./grounding";
import { siteDoesNotSay, takeGapMarker } from "./gap";
import { type ChatMessage, type CompletionResult, complete } from "./openrouter";
import { buildMessages } from "./prompt";
import type { AskEvent, AskTurn, FallbackReason } from "./protocol";
import { isOffTopic, offTopicReply } from "./off-topic";
import { moreAbout, smallTalk, smallTalkReply } from "./small-talk";
import { CitationMap, extractiveSources } from "./sources";

export interface AskInput {
  locale: string;
  question: string;
  history: readonly AskTurn[];
}

/** Asks a free OpenRouter model for a structured answer; see openrouter.ts. */
export type Generate = (messages: ChatMessage[], signal?: AbortSignal) => Promise<CompletionResult>;

export interface AskContext {
  retriever: Retriever;
  /**
   * Every public passage of the locale, in a stable order. Claude reads all
   * of it, so a vague question ("who is Victor?") still has something to
   * answer from; the profile passage is the core the free models get when
   * the search finds too little. Absent in tests that only need the search.
   */
  site?: readonly Passage[];
  /** Claude, first choice; null or absent without ANTHROPIC_API_KEY. */
  claude?: ClaudeAnswer | null;
  /** The free OpenRouter models, the fallback; null without OPENROUTER_API_KEY. */
  generate: Generate | null;
  /** Asked only before calling a model; true means the answer is extractive. */
  isRateLimited?: () => Promise<boolean>;
  signal?: AbortSignal;
  /** Called with reason codes and token counts only, never the question or the answer. */
  log?: (message: string) => void;
}

/** Documents sent with a follow-up: the new question's passages and the previous turn's. */
export const MAX_DOCUMENTS = 10;
/** Follow-ups offered under an answer. */
const MAX_SUGGESTIONS = 2;

/** The OpenRouter-backed generator for a key. */
export function openRouterGenerate(apiKey: string): Generate {
  return (messages, signal) =>
    complete({
      apiKey,
      messages,
      schema: ANSWER_SCHEMA,
      // An off-schema reply is worth another model, not an extractive answer.
      accept: (content) => parseModelAnswer(content) !== null,
      ...(signal && { signal }),
    });
}

/**
 * Passages for a question. A follow-up ("and before that?") rarely names its
 * subject, so it is also searched together with the previous question, and
 * the previous question's own passages are sent again: facts already said
 * stay citable. The server keeps no state; the retriever is deterministic, so
 * the previous turn's passages are found again from its question.
 */
export function retrieveFor(retriever: Retriever, question: string, history: readonly AskTurn[]): RetrievedPassage[] {
  const previous = history.at(-1)?.question;
  const own = retriever.retrieve(question);
  if (previous === undefined) return own;
  const merged = [...own, ...retriever.retrieve(`${previous} ${question}`), ...retriever.retrieve(previous)];
  const seen = new Set<string>();
  return merged.filter((passage) => !seen.has(passage.id) && seen.add(passage.id)).slice(0, Math.max(MAX_PASSAGES, MAX_DOCUMENTS));
}

function* extractive(passages: readonly RetrievedPassage[], reason: FallbackReason): Generator<AskEvent, void, undefined> {
  yield { type: "status", mode: "extractive", reason };
  yield { type: "sources", sources: extractiveSources(passages) };
  yield { type: "done" };
}

function* unknown(passages: readonly RetrievedPassage[]): Generator<AskEvent, void, undefined> {
  yield { type: "status", mode: "unknown" };
  yield { type: "sources", sources: new CitationMap(passages).sources() };
  yield { type: "done" };
}

/** What a model's answer came to, once its sentences have been checked and sent. */
type Outcome =
  | { kind: "answered" }
  /** Nothing was sent yet: the next provider may try. */
  | { kind: "fallback"; reason: string }
  | { kind: "aborted" }
  | { kind: "unknown" }
  | { kind: "ungrounded" };

/** A list item: a bullet or a number at the start of its line. */
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;
/** A line that introduces what follows ("Some of the things I did:"). */
const LEAD_IN = /:\s*$/;

/**
 * Checks sentences as they come and turns them into events (protocol.ts).
 * A dropped claim makes the answer partial; a dropped connective does not.
 * A lead-in line (ending in ":") waits for its first list item; if every item
 * is dropped, or the answer goes on without one, it is dropped too, so no
 * answer ends on an introduction to nothing.
 * Uncited sentences are held until the first cited one: an answer with no
 * cited sentence at all is "I don't know" (when it is short) or ungrounded,
 * never shown as is. After `MAX_SENTENCES` or `MAX_ANSWER_LENGTH` the rest is
 * cut, and the answer is partial.
 */
class Emitter {
  readonly dropped: DropReason[] = [];
  /** A dropped sentence was a claim: the answer is partial. */
  claimDropped = false;
  truncated = false;
  private held: { text: string; cited: number[] }[] = [];
  /** The last sentence kept (held or sent): a sentence that only restates it is dropped (`repeats`). */
  private last: { text: string; cited: number[] } | null = null;
  /** A checked lead-in line, waiting for its first list item. */
  private leadIn: { text: string; cited: number[] } | null = null;
  private started = false;
  private sentences = 0;
  private length = 0;
  /** What an uncited sentence may draw on: the pages the answer is about, plus every passage cited so far. */
  private readonly scope: RetrievedPassage[];

  constructor(
    private readonly corpus: Corpus,
    readonly citations: CitationMap
  ) {
    this.scope = [...(corpus.scope ?? corpus.passages)];
  }

  get sent() {
    return this.started;
  }

  get heldCount() {
    return this.held.length;
  }

  *accept(sentence: PendingSentence): Generator<AskEvent, void, undefined> {
    if (this.sentences >= MAX_SENTENCES || this.length >= MAX_ANSWER_LENGTH) {
      if (sentence.text.trim() !== "") this.truncated = true;
      return;
    }
    const check = checkSentence(sentence.text, sentence.cited, { ...this.corpus, scope: this.scope });
    if (!check.ok) {
      this.dropped.push(check.reason);
      this.claimDropped ||= isClaim(check.reason, sentence.cited);
      return;
    }
    for (const index of sentence.cited) {
      const passage = this.corpus.passages[index];
      if (passage !== undefined && !this.scope.includes(passage)) this.scope.push(passage);
    }
    const checked = { text: check.text, cited: sentence.cited };
    if (LEAD_IN.test(checked.text)) {
      this.dropLeadIn();
      this.leadIn = checked;
      return;
    }
    if (this.leadIn !== null) {
      const leadIn = this.leadIn;
      this.leadIn = null;
      if (LIST_ITEM.test(checked.text)) yield* this.keep(leadIn);
      else this.dropped.push("dangling");
    }
    yield* this.keep(checked);
  }

  /** A lead-in with no list item after it: dropped, not a claim (the items it announced were). */
  private dropLeadIn() {
    if (this.leadIn === null) return;
    this.leadIn = null;
    this.dropped.push("dangling");
  }

  private *keep(sentence: { text: string; cited: number[] }): Generator<AskEvent, void, undefined> {
    if (this.last !== null && repeats(this.last.text, sentence.text)) {
      // Not a claim lost: the sentence before says the same. Its citations move there.
      this.dropped.push("repeat");
      const last = this.last;
      const added = sentence.cited.filter((index) => !last.cited.includes(index));
      last.cited.push(...added);
      if (this.started) yield* this.cite(added);
      else if (last.cited.length > 0) yield* this.start();
      return;
    }
    // A copy: a repeat after it may add citations to it, even while it is held.
    const checked = { text: sentence.text, cited: [...sentence.cited] };
    this.last = checked;
    this.sentences++;
    this.length += checked.text.length;
    if (!this.started && checked.cited.length === 0) {
      this.held.push(checked);
      return;
    }
    if (!this.started) yield* this.start();
    yield* this.send(checked);
  }

  /** The first cited sentence: the answer starts, with the uncited ones held before it. */
  private *start(): Generator<AskEvent, void, undefined> {
    this.started = true;
    yield { type: "checking" };
    yield { type: "status", mode: "model" };
    for (const held of this.held) yield* this.send(held);
    this.held = [];
  }

  private *send(sentence: { text: string; cited: number[] }): Generator<AskEvent, void, undefined> {
    // The text keeps its own spacing and line breaks (list items); the citation numbers follow it.
    yield { type: "text", text: sentence.text };
    yield* this.cite(sentence.cited);
  }

  private *cite(cited: readonly number[]): Generator<AskEvent, void, undefined> {
    const numbers = [...new Set(cited.flatMap((index) => this.citations.cite(index) ?? []))];
    for (const n of numbers) yield { type: "cite", n };
  }

  /** The answer is over: a lead-in still waiting has no item to introduce. */
  end() {
    this.dropLeadIn();
  }

  /**
   * Nothing cited. A short reply ("the site doesn't say", "I only answer
   * about my work"), even one whose wording did not pass, is "the site doesn't
   * say": an off-topic question reaches Claude now that it reads the whole
   * site. A dropped claim, or a long uncited reply, is ungrounded.
   */
  noAnswer(): Outcome {
    return this.held.length <= 2 && !this.claimDropped ? { kind: "unknown" } : { kind: "ungrounded" };
  }

  /**
   * The answer's end. `gap`: the model said the site covers only part of the
   * question, so the answer ends with the site's own sentence saying so (gap.ts).
   */
  *finish(
    locale: string,
    { partial = false, gap = false }: { partial?: boolean; gap?: boolean } = {}
  ): Generator<AskEvent, void, undefined> {
    if (gap) yield { type: "text", text: `\n\n${siteDoesNotSay(locale)}` };
    if (partial || gap || this.truncated || this.claimDropped) yield { type: "partial" };
    const sources = this.citations.sources();
    const related = sources.filter((source) => source.n === null).slice(0, MAX_SUGGESTIONS);
    if (related.length > 0) yield { type: "suggestions", questions: related.map((source) => moreAbout(locale, source.title)) };
    yield { type: "sources", sources };
    yield { type: "done" };
  }
}

/** Claude, streamed: each finished block goes through the sentence buffer and the checks. */
async function* fromClaude(
  claude: ClaudeAnswer,
  input: AskInput,
  passages: readonly RetrievedPassage[],
  corpus: Corpus,
  related: readonly RetrievedPassage[],
  context: AskContext
): AsyncGenerator<AskEvent, Outcome, undefined> {
  const emitter = new Emitter(corpus, new CitationMap(passages, related));
  const buffer = new SentenceBuffer();
  let stopReason: string | null = null;
  /** Claude ended with the marker: the pages cover only part of the question. */
  let gap = false;
  try {
    for await (const event of claude({ ...input, passages }, context.signal)) {
      if (event.type === "end") {
        stopReason = event.stopReason;
        const { input: read, output, cacheRead, cacheWrite } = event.usage;
        context.log?.(
          `usage provider=anthropic stop=${String(stopReason)} input=${String(read)} output=${String(output)} cache_read=${String(cacheRead)} cache_write=${String(cacheWrite)}`
        );
        break;
      }
      // A refusal ends the turn; whatever came before it is discarded below, not shown.
      // The marker is a signal, not text: it never reaches the checks or the visitor.
      const { text, found } = takeGapMarker(event.block.text);
      gap ||= found;
      buffer.push({ text, cited: event.block.cited });
      for (const sentence of buffer.drain()) yield* emitter.accept(sentence);
    }
  } catch (error) {
    const failure = error instanceof ClaudeFailure ? error : new ClaudeFailure("http");
    if (failure.reason === "aborted") return { kind: "aborted" };
    context.log?.(`claude_failed reason=${failure.reason}${failure.status === undefined ? "" : ` status=${String(failure.status)}`}`);
    if (!emitter.sent) return { kind: "fallback", reason: failure.reason };
    // Sentences already went out: say the answer was cut, keep what was checked.
    yield { type: "error" };
    yield* emitter.finish(input.locale, { partial: true });
    return { kind: "answered" };
  }

  if (stopReason === "refusal") {
    context.log?.("claude_refused");
    if (!emitter.sent) return { kind: "fallback", reason: "refusal" };
    yield { type: "error" };
    yield* emitter.finish(input.locale, { partial: true });
    return { kind: "answered" };
  }
  for (const sentence of buffer.drain(true)) yield* emitter.accept(sentence);
  emitter.end();
  if (!emitter.sent) {
    const outcome = emitter.noAnswer();
    context.log?.(`${outcome.kind} provider=anthropic dropped=${emitter.dropped.join(",") || "-"}`);
    return outcome;
  }
  if (emitter.dropped.length > 0) context.log?.(`dropped provider=anthropic ${emitter.dropped.join(",")}`);
  if (gap) context.log?.("incomplete provider=anthropic");
  yield* emitter.finish(input.locale, { partial: stopReason === "max_tokens", gap });
  return { kind: "answered" };
}

/** The free OpenRouter models, buffered: one JSON answer, checked sentence by sentence with the same rules. */
async function* fromOpenRouter(
  generate: Generate,
  input: AskInput,
  passages: readonly RetrievedPassage[],
  corpus: Corpus,
  context: AskContext
): AsyncGenerator<AskEvent, Outcome, undefined> {
  const result = await generate(buildMessages(input.locale, input.question, input.history, passages), context.signal);
  if (!result.ok) {
    if (result.reason === "aborted") return { kind: "aborted" };
    context.log?.(
      `model_failed reason=${result.reason}${result.status === undefined ? "" : ` status=${String(result.status)}`}${result.model === undefined ? "" : ` model=${result.model}`}`
    );
    return { kind: "fallback", reason: result.reason };
  }
  const grounded = groundAnswer(result.content, corpus);
  if (grounded === null) {
    context.log?.(`invalid_answer model=${result.model}`);
    return { kind: "fallback", reason: "invalid" };
  }
  if (!grounded.answerable) {
    context.log?.(`unknown model=${result.model}`);
    return { kind: "unknown" };
  }
  const emitter = new Emitter(corpus, new CitationMap(passages));
  for (const sentence of grounded.sentences) {
    // Rejoined as Markdown: list items on their own lines, sentences separated by a space.
    const text = /^\s*(?:[-*+]|\d+[.)])\s/.test(sentence.text) ? `\n${sentence.text}` : ` ${sentence.text}`;
    yield* emitter.accept({ text, cited: sentence.passages });
  }
  emitter.end();
  emitter.dropped.unshift(...grounded.dropped);
  emitter.claimDropped ||= grounded.claimDropped;
  if (!emitter.sent) {
    context.log?.(`ungrounded model=${result.model} dropped=${emitter.dropped.join(",") || "-"}`);
    return emitter.heldCount > 0 && emitter.heldCount <= 2 && !emitter.claimDropped ? { kind: "unknown" } : { kind: "ungrounded" };
  }
  if (emitter.dropped.length > 0) context.log?.(`dropped model=${result.model} ${emitter.dropped.join(",")}`);
  yield* emitter.finish(input.locale, { gap: grounded.incomplete });
  return { kind: "answered" };
}

/** A site passage as the engine handles it: not found by a search, so no score and no matched terms. */
export function asRetrieved(passage: Passage): RetrievedPassage {
  return { ...passage, score: 0, terms: [] };
}

/** With fewer pages than this from the search, the profile passage joins them (the free models' core). */
const CORE_BELOW = 2;

/**
 * The pages an answer is about: the search's, and the profile passage (who
 * Victor is, his current role) when the search finds too little, as for "who
 * is Victor?". The free models read these; Claude reads the whole site, and
 * these scope what an uncited sentence may draw on (grounding.ts).
 */
export function focusPassages(retrieved: readonly RetrievedPassage[], site: readonly RetrievedPassage[]): RetrievedPassage[] {
  if (retrieved.length >= CORE_BELOW) return [...retrieved];
  const ids = new Set(retrieved.map((passage) => passage.id));
  return [...retrieved, ...site.filter((passage) => passage.type === "profile" && !ids.has(passage.id))];
}

/**
 * The whole answer as events (protocol.ts).
 * - Small talk gets a fixed reply, with no search and no model.
 * - Claude Haiku 5.5 answers first and reads the whole site (ADR 0011,
 *   2026-11-27): the question does not have to name what it is about.
 *   Its answer is streamed with citations, every sentence checked before it
 *   is sent (grounding.ts). If it is not configured, fails, times out,
 *   refuses, or breaks before a checked sentence went out, the free
 *   OpenRouter models answer under the same rules from the search's pages
 *   (plus the profile when the search finds too little); if they cannot
 *   either, the answer is those pages themselves (extractive).
 * - A first question that names neither the owner nor the site and that the
 *   search finds nothing for is off topic: a fixed reply, no model.
 * - No source, no answer: only when no model can answer and the search found
 *   nothing.
 * - When the model finds no answer, the answer is that the site does not say.
 */
export async function* ask(input: AskInput, context: AskContext): AsyncGenerator<AskEvent, void, undefined> {
  const intent = smallTalk(input.question);
  if (intent !== null) {
    yield { type: "status", mode: "small-talk" };
    yield { type: "text", text: smallTalkReply(input.locale, intent) };
    yield { type: "done" };
    return;
  }

  const retrieved = retrieveFor(context.retriever, input.question, input.history);
  // Nothing about the owner or the site in a first question: a fixed reply, no model (off-topic.ts).
  if (isOffTopic(input.question, retrieved, input.history.length)) {
    context.log?.("off-topic");
    yield { type: "status", mode: "small-talk" };
    yield { type: "text", text: offTopicReply(input.locale) };
    yield { type: "done" };
    return;
  }
  const site = (context.site ?? []).map(asRetrieved);
  const claude = context.claude ?? null;
  const wholeSite = claude !== null && site.length > 0;
  const focus = focusPassages(retrieved, site);
  const noModel = claude === null && context.generate === null;
  if ((noModel && retrieved.length === 0) || (!wholeSite && focus.length === 0)) {
    yield { type: "status", mode: "no-source" };
    yield { type: "done" };
    return;
  }
  if (noModel) {
    yield* extractive(focus, "unavailable");
    return;
  }
  if ((await context.isRateLimited?.()) === true) {
    if (focus.length === 0) {
      yield { type: "status", mode: "no-source" };
      yield { type: "done" };
      return;
    }
    yield* extractive(focus, "rate-limited");
    return;
  }

  // The model can take a while: show which pages the answer is about meanwhile (and that Claude read them all).
  yield {
    type: "reading",
    pages: new CitationMap(focus).sources().map(({ title, url }) => ({ title, url })),
    ...(wholeSite && { site: true }),
  };
  const conversation = [...input.history.flatMap((turn) => [turn.question, turn.answer]), input.question].join("\n");

  let outcome: Outcome = { kind: "fallback", reason: "unavailable" };
  if (claude !== null) {
    const documents = wholeSite ? site : focus;
    outcome = yield* fromClaude(claude, input, documents, { passages: documents, scope: focus, conversation }, retrieved, context);
  }
  if (outcome.kind === "fallback" && context.generate !== null && focus.length > 0)
    outcome = yield* fromOpenRouter(context.generate, input, focus, { passages: focus, conversation }, context);

  switch (outcome.kind) {
    case "answered":
    case "aborted":
      return;
    case "unknown":
      yield { type: "checking" };
      yield* unknown(focus);
      return;
    case "ungrounded":
      yield { type: "checking" };
      yield* focus.length > 0 ? extractive(focus, "ungrounded") : unknown(focus);
      return;
    case "fallback":
      if (focus.length === 0) {
        yield { type: "error" };
        yield { type: "done" };
        return;
      }
      yield* extractive(focus, "error");
      return;
  }
}
