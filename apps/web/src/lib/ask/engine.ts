import Anthropic from "@anthropic-ai/sdk";
import type { Retriever, RetrievedPassage } from "@workspace/search";

import { buildMessages, MAX_TOKENS, MODEL, systemPrompt } from "./prompt";
import type { AskEvent, AskTurn, FallbackReason } from "./protocol";
import { CitationMap, extractiveSources } from "./sources";

export interface AskInput {
  locale: string;
  question: string;
  history: readonly AskTurn[];
}

export interface AskContext {
  retriever: Retriever;
  /** null when there is no API key: the answer is extractive. */
  client: Anthropic | null;
  /** Asked only before calling the model; true means the answer is extractive. */
  isRateLimited?: () => Promise<boolean>;
  signal?: AbortSignal;
  /** Called with a reason code only, never the question. */
  log?: (message: string) => void;
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
 * passage above the threshold the model is never called. Without a key, over
 * the rate limit, or when the model fails before writing anything, the answer
 * is the matching passages themselves.
 */
export async function* ask(input: AskInput, context: AskContext): AsyncGenerator<AskEvent, void, undefined> {
  const passages = retrieveFor(context.retriever, input.question, input.history);
  if (passages.length === 0) {
    yield { type: "status", mode: "no-source" };
    yield { type: "done" };
    return;
  }
  if (context.client === null) {
    yield* extractive(passages, "unavailable");
    return;
  }
  if ((await context.isRateLimited?.()) === true) {
    yield* extractive(passages, "rate-limited");
    return;
  }

  const citations = new CitationMap(passages);
  let started = false;
  /** Citation numbers of the text block being streamed, shown after its text. */
  let pending: number[] = [];

  try {
    const stream = context.client.messages.stream(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        output_config: { effort: "low" },
        system: systemPrompt(input.locale),
        messages: buildMessages(input.question, input.history, passages),
      },
      { signal: context.signal }
    );

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        if (!started) {
          started = true;
          yield { type: "status", mode: "model" };
        }
        yield { type: "text", text: event.delta.text };
      } else if (
        event.type === "content_block_delta" &&
        event.delta.type === "citations_delta" &&
        event.delta.citation.type === "search_result_location"
      ) {
        const n = citations.cite(event.delta.citation.search_result_index);
        if (n !== undefined && !pending.includes(n)) pending.push(n);
      } else if (event.type === "content_block_stop" && pending.length > 0) {
        for (const n of pending) yield { type: "cite", n };
        pending = [];
      } else if (event.type === "message_delta" && event.delta.stop_reason !== null && event.delta.stop_reason !== "end_turn") {
        context.log?.(`stop_reason=${event.delta.stop_reason}`);
      }
    }
  } catch (error) {
    if (context.signal?.aborted === true) return;
    context.log?.(error instanceof Anthropic.APIError ? `api_error status=${String(error.status)}` : "stream_error");
    if (!started) {
      yield* extractive(passages, "error");
      return;
    }
    yield { type: "error" };
    return;
  }

  if (!started) {
    // A refusal, or a budget spent before any text: nothing to show from the model.
    yield* extractive(passages, "error");
    return;
  }
  yield { type: "sources", sources: citations.sources() };
  yield { type: "done" };
}
