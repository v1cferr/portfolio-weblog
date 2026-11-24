import type { Retriever, RetrievedPassage } from "@workspace/search";

import { ANSWER_SCHEMA, groundAnswer, parseModelAnswer } from "./grounding";
import { type ChatMessage, type CompletionResult, complete } from "./openrouter";
import { buildMessages } from "./prompt";
import type { AskEvent, AskTurn, FallbackReason } from "./protocol";
import { CitationMap, extractiveSources } from "./sources";

export interface AskInput {
  locale: string;
  question: string;
  history: readonly AskTurn[];
}

/** Asks a model for a structured answer; see openrouter.ts. */
export type Generate = (messages: ChatMessage[], signal?: AbortSignal) => Promise<CompletionResult>;

export interface AskContext {
  retriever: Retriever;
  /** null when there is no API key: the answer is extractive. */
  generate: Generate | null;
  /** Asked only before calling the model; true means the answer is extractive. */
  isRateLimited?: () => Promise<boolean>;
  signal?: AbortSignal;
  /** Called with reason codes only, never the question or the answer. */
  log?: (message: string) => void;
}

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
 * subject, so with nothing found it is retried together with the previous
 * question.
 */
export function retrieveFor(retriever: Retriever, question: string, history: readonly AskTurn[]): RetrievedPassage[] {
  const passages = retriever.retrieve(question);
  const previous = history.at(-1)?.question;
  if (passages.length > 0 || previous === undefined) return passages;
  return retriever.retrieve(`${previous} ${question}`);
}

function* extractive(passages: readonly RetrievedPassage[], reason: FallbackReason): Generator<AskEvent, void, undefined> {
  yield { type: "status", mode: "extractive", reason };
  yield { type: "sources", sources: extractiveSources(passages) };
  yield { type: "done" };
}

/**
 * The whole answer as events (protocol.ts). No source, no answer: without a
 * passage above the threshold the model is never called. The model's reply
 * is buffered and checked (grounding.ts) before anything is sent; only
 * sentences that cite real passages and stay close to them reach the
 * visitor. When the model finds no answer in the passages, the answer is that
 * the site does not say. Without a key, over the rate limit, when the model
 * fails, or when nothing survives the checks, the answer is the matching
 * passages themselves.
 */
export async function* ask(input: AskInput, context: AskContext): AsyncGenerator<AskEvent, void, undefined> {
  const passages = retrieveFor(context.retriever, input.question, input.history);
  if (passages.length === 0) {
    yield { type: "status", mode: "no-source" };
    yield { type: "done" };
    return;
  }
  if (context.generate === null) {
    yield* extractive(passages, "unavailable");
    return;
  }
  if ((await context.isRateLimited?.()) === true) {
    yield* extractive(passages, "rate-limited");
    return;
  }

  const result = await context.generate(buildMessages(input.locale, input.question, input.history, passages), context.signal);
  if (!result.ok) {
    if (result.reason === "aborted") return;
    context.log?.(
      `model_failed reason=${result.reason}${result.status === undefined ? "" : ` status=${String(result.status)}`}${result.model === undefined ? "" : ` model=${result.model}`}`
    );
    yield* extractive(passages, "error");
    return;
  }

  const grounded = groundAnswer(result.content, passages);
  if (grounded === null) {
    context.log?.(`invalid_answer model=${result.model}`);
    yield* extractive(passages, "error");
    return;
  }
  if (grounded.dropped.length > 0) context.log?.(`dropped model=${result.model} ${grounded.dropped.join(",")}`);
  if (!grounded.answerable) {
    // The model read the closest pages and found no answer: say so, and show the pages it read.
    context.log?.(`unknown model=${result.model}`);
    yield { type: "status", mode: "unknown" };
    yield { type: "sources", sources: new CitationMap(passages).sources() };
    yield { type: "done" };
    return;
  }
  if (grounded.sentences.length === 0) {
    context.log?.(`ungrounded model=${result.model}`);
    yield* extractive(passages, "ungrounded");
    return;
  }

  const citations = new CitationMap(passages);
  // Dropped sentences were claims the pages do not back, so what is left may not answer everything.
  const partial = grounded.incomplete || grounded.dropped.length > 0;
  yield { type: "status", mode: "model", ...(partial && { partial: true as const }) };
  for (const [index, sentence] of grounded.sentences.entries()) {
    // Numbers are given in order of first citation, one per page.
    const numbers = [...new Set(sentence.passages.flatMap((passage) => citations.cite(passage) ?? []))];
    yield { type: "text", text: index === 0 ? sentence.text : ` ${sentence.text}` };
    for (const n of numbers) yield { type: "cite", n };
  }
  yield { type: "sources", sources: citations.sources() };
  yield { type: "done" };
}
