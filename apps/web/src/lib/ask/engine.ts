import { MAX_PASSAGES, type Retriever, type RetrievedPassage } from "@workspace/search";

import { type ClaudeAnswer, ClaudeFailure } from "./anthropic";
import {
  ANSWER_SCHEMA,
  checkSentence,
  type Corpus,
  type DropReason,
  groundAnswer,
  MAX_ANSWER_LENGTH,
  MAX_SENTENCES,
  parseModelAnswer,
  type PendingSentence,
  SentenceBuffer,
} from "./grounding";
import { type ChatMessage, type CompletionResult, complete } from "./openrouter";
import { buildMessages } from "./prompt";
import type { AskEvent, AskTurn, FallbackReason } from "./protocol";
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

/**
 * Checks sentences as they come and turns them into events (protocol.ts).
 * Uncited sentences are held until the first cited one: an answer with no
 * cited sentence at all is "I don't know" (when it is short) or ungrounded,
 * never shown as is. After `MAX_SENTENCES` or `MAX_ANSWER_LENGTH` the rest is
 * cut, and the answer is partial.
 */
class Emitter {
  readonly dropped: DropReason[] = [];
  truncated = false;
  private held: { text: string; cited: number[] }[] = [];
  private started = false;
  private sentences = 0;
  private length = 0;

  constructor(
    private readonly corpus: Corpus,
    readonly citations: CitationMap
  ) {}

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
    const check = checkSentence(sentence.text, sentence.cited, this.corpus);
    if (!check.ok) {
      this.dropped.push(check.reason);
      return;
    }
    this.sentences++;
    this.length += check.text.length;
    const checked = { text: check.text, cited: sentence.cited };
    if (!this.started && checked.cited.length === 0) {
      this.held.push(checked);
      return;
    }
    if (!this.started) {
      this.started = true;
      yield { type: "checking" };
      yield { type: "status", mode: "model" };
      for (const held of this.held) yield* this.send(held);
      this.held = [];
    }
    yield* this.send(checked);
  }

  private *send(sentence: { text: string; cited: number[] }): Generator<AskEvent, void, undefined> {
    // The text keeps its own spacing and line breaks (list items); the citation numbers follow it.
    yield { type: "text", text: sentence.text };
    const numbers = [...new Set(sentence.cited.flatMap((index) => this.citations.cite(index) ?? []))];
    for (const n of numbers) yield { type: "cite", n };
  }

  /** Nothing cited: a short reply is "the site doesn't say"; a long one cited nothing it claimed. */
  noAnswer(): Outcome {
    return this.held.length > 0 && this.held.length <= 2 && this.dropped.length === 0 ? { kind: "unknown" } : { kind: "ungrounded" };
  }

  *finish(locale: string, partial: boolean): Generator<AskEvent, void, undefined> {
    if (partial || this.truncated || this.dropped.length > 0) yield { type: "partial" };
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
  context: AskContext
): AsyncGenerator<AskEvent, Outcome, undefined> {
  const emitter = new Emitter(corpus, new CitationMap(passages));
  const buffer = new SentenceBuffer();
  let stopReason: string | null = null;
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
      buffer.push({ text: event.block.text, cited: event.block.cited });
      for (const sentence of buffer.drain()) yield* emitter.accept(sentence);
    }
  } catch (error) {
    const failure = error instanceof ClaudeFailure ? error : new ClaudeFailure("http");
    if (failure.reason === "aborted") return { kind: "aborted" };
    context.log?.(`claude_failed reason=${failure.reason}${failure.status === undefined ? "" : ` status=${String(failure.status)}`}`);
    if (!emitter.sent) return { kind: "fallback", reason: failure.reason };
    // Sentences already went out: say the answer was cut, keep what was checked.
    yield { type: "error" };
    yield* emitter.finish(input.locale, true);
    return { kind: "answered" };
  }

  if (stopReason === "refusal") {
    context.log?.("claude_refused");
    if (!emitter.sent) return { kind: "fallback", reason: "refusal" };
    yield { type: "error" };
    yield* emitter.finish(input.locale, true);
    return { kind: "answered" };
  }
  for (const sentence of buffer.drain(true)) yield* emitter.accept(sentence);
  if (!emitter.sent) {
    const outcome = emitter.noAnswer();
    context.log?.(`${outcome.kind} provider=anthropic dropped=${emitter.dropped.join(",") || "-"}`);
    return outcome;
  }
  if (emitter.dropped.length > 0) context.log?.(`dropped provider=anthropic ${emitter.dropped.join(",")}`);
  yield* emitter.finish(input.locale, stopReason === "max_tokens");
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
  emitter.dropped.unshift(...grounded.dropped);
  if (!emitter.sent) {
    context.log?.(`ungrounded model=${result.model} dropped=${emitter.dropped.join(",") || "-"}`);
    return emitter.heldCount > 0 && emitter.heldCount <= 2 && grounded.dropped.length === 0 ? { kind: "unknown" } : { kind: "ungrounded" };
  }
  if (emitter.dropped.length > 0) context.log?.(`dropped model=${result.model} ${emitter.dropped.join(",")}`);
  yield* emitter.finish(input.locale, grounded.incomplete);
  return { kind: "answered" };
}

/**
 * The whole answer as events (protocol.ts).
 * - Small talk gets a fixed reply, with no search and no model.
 * - No source, no answer: without a passage above the threshold no model is
 *   called.
 * - Claude Haiku 5.5 answers first, streamed with citations, every sentence
 *   checked before it is sent (grounding.ts). If it is not configured, fails,
 *   times out, refuses, or breaks before a checked sentence went out, the
 *   free OpenRouter models answer under the same rules; if they cannot
 *   either, the answer is the matching passages themselves (extractive).
 * - When the model finds no answer in the passages, the answer is that the
 *   site does not say.
 */
export async function* ask(input: AskInput, context: AskContext): AsyncGenerator<AskEvent, void, undefined> {
  const intent = smallTalk(input.question);
  if (intent !== null) {
    yield { type: "status", mode: "small-talk" };
    yield { type: "text", text: smallTalkReply(input.locale, intent) };
    yield { type: "done" };
    return;
  }

  const passages = retrieveFor(context.retriever, input.question, input.history);
  if (passages.length === 0) {
    yield { type: "status", mode: "no-source" };
    yield { type: "done" };
    return;
  }
  const claude = context.claude ?? null;
  if (claude === null && context.generate === null) {
    yield* extractive(passages, "unavailable");
    return;
  }
  if ((await context.isRateLimited?.()) === true) {
    yield* extractive(passages, "rate-limited");
    return;
  }

  // The model can take a while: show which pages it is reading meanwhile.
  yield { type: "reading", pages: new CitationMap(passages).sources().map(({ title, url }) => ({ title, url })) };
  const corpus: Corpus = {
    passages,
    conversation: [...input.history.flatMap((turn) => [turn.question, turn.answer]), input.question].join("\n"),
  };

  let outcome: Outcome = { kind: "fallback", reason: "unavailable" };
  if (claude !== null) outcome = yield* fromClaude(claude, input, passages, corpus, context);
  if (outcome.kind === "fallback" && context.generate !== null)
    outcome = yield* fromOpenRouter(context.generate, input, passages, corpus, context);

  switch (outcome.kind) {
    case "answered":
    case "aborted":
      return;
    case "unknown":
      yield { type: "checking" };
      yield* unknown(passages);
      return;
    case "ungrounded":
      yield { type: "checking" };
      yield* extractive(passages, "ungrounded");
      return;
    case "fallback":
      yield* extractive(passages, "error");
      return;
  }
}
