import Anthropic from "@anthropic-ai/sdk";
import type { RetrievedPassage } from "@workspace/search";

import { buildClaudeRequest } from "./prompt";
import type { AskTurn } from "./protocol";

/**
 * Claude Haiku 5.5 through the official SDK, streamed, with the Citations API
 * (ADR 0011). This module only turns the SDK's stream into whole text blocks
 * and their citations; checking them is the engine's job (grounding.ts).
 */

/** Time for the whole answer; past it the chat falls back to the free models. */
export const CLAUDE_TIMEOUT_MS = 25_000;

/** The API key, or null without ANTHROPIC_API_KEY: the chat then tries the free models. Server only. */
export function getAnthropicKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY;
  return key === undefined || key === "" ? null : key;
}

/** One finished text block: its text and the passages it cites (0-based, the request's document order). */
export interface ClaudeBlock {
  text: string;
  cited: number[];
}

export interface ClaudeUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export type ClaudeEvent =
  { type: "block"; block: ClaudeBlock } | { type: "end"; stopReason: Anthropic.StopReason | null; usage: ClaudeUsage };

export type ClaudeFailureReason = "aborted" | "timeout" | "connection" | "rate-limited" | "overloaded" | "auth" | "request" | "http";

/** A request that did not complete, classified from the SDK's typed errors. */
export class ClaudeFailure extends Error {
  constructor(
    readonly reason: ClaudeFailureReason,
    readonly status?: number
  ) {
    super(`claude ${reason}${status === undefined ? "" : ` ${String(status)}`}`);
  }
}

/** Most specific first: aborts and timeouts before connection errors, status classes before the generic API error. */
export function classifyError(error: unknown, signal?: AbortSignal): ClaudeFailure {
  if (error instanceof ClaudeFailure) return error;
  if (signal?.aborted === true || error instanceof Anthropic.APIUserAbortError) return new ClaudeFailure("aborted");
  if (error instanceof Anthropic.APIConnectionTimeoutError) return new ClaudeFailure("timeout");
  if (error instanceof Anthropic.APIConnectionError) return new ClaudeFailure("connection");
  if (error instanceof Anthropic.RateLimitError) return new ClaudeFailure("rate-limited", 429);
  if (error instanceof Anthropic.AuthenticationError) return new ClaudeFailure("auth", 401);
  if (error instanceof Anthropic.PermissionDeniedError) return new ClaudeFailure("auth", 403);
  if (error instanceof Anthropic.BadRequestError) return new ClaudeFailure("request", 400);
  const status: unknown = error instanceof Anthropic.APIError ? error.status : undefined;
  const code = typeof status === "number" ? status : undefined;
  if (error instanceof Anthropic.InternalServerError) return new ClaudeFailure("overloaded", code);
  if (error instanceof Anthropic.APIError) return new ClaudeFailure("http", code);
  return new ClaudeFailure("http");
}

export interface ClaudeRequest {
  locale: string;
  question: string;
  history: readonly AskTurn[];
  passages: readonly RetrievedPassage[];
}

/** Streams an answer as finished text blocks, then its end; throws a ClaudeFailure. */
export type ClaudeAnswer = (request: ClaudeRequest, signal?: AbortSignal) => AsyncGenerator<ClaudeEvent, void, undefined>;

/** The part of the SDK client this module uses, so tests can hand in a fake stream. */
export interface MessagesClient {
  messages: {
    stream: (
      params: Anthropic.MessageCreateParamsNonStreaming,
      options?: Anthropic.RequestOptions
    ) => AsyncIterable<Anthropic.MessageStreamEvent>;
  };
}

/** A client for a key: no SDK retries (the fallback chain is the retry), and the chat's own time limit. */
export function createClaudeClient(apiKey: string): MessagesClient {
  return new Anthropic({ apiKey, maxRetries: 0, timeout: CLAUDE_TIMEOUT_MS });
}

/**
 * Claude's answer for a client. Text blocks are collected from their deltas
 * (`text_delta`, and `citations_delta` for each citation, which may come
 * before or after the text) and handed on whole at `content_block_stop`.
 * Thinking blocks are skipped. Only plain-text citations (`char_location`)
 * are read: they are the only kind the documents can produce.
 */
export function claudeAnswer(client: MessagesClient): ClaudeAnswer {
  return async function* answer(request, signal) {
    const timeout = AbortSignal.timeout(CLAUDE_TIMEOUT_MS);
    const params = buildClaudeRequest(request.locale, request.question, request.history, request.passages);
    const usage: ClaudeUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    let stopReason: Anthropic.StopReason | null = null;
    let current: ClaudeBlock | null = null;
    try {
      const stream = client.messages.stream(params, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
      for await (const event of stream) {
        switch (event.type) {
          case "message_start":
            usage.input = event.message.usage.input_tokens;
            usage.cacheRead = event.message.usage.cache_read_input_tokens ?? 0;
            usage.cacheWrite = event.message.usage.cache_creation_input_tokens ?? 0;
            break;
          case "content_block_start":
            current =
              event.content_block.type === "text"
                ? { text: event.content_block.text, cited: (event.content_block.citations ?? []).flatMap(citedDocument) }
                : null;
            break;
          case "content_block_delta":
            if (current === null) break;
            if (event.delta.type === "text_delta") current.text += event.delta.text;
            else if (event.delta.type === "citations_delta") current.cited.push(...citedDocument(event.delta.citation));
            break;
          case "content_block_stop":
            if (current !== null) yield { type: "block", block: { text: current.text, cited: [...new Set(current.cited)] } };
            current = null;
            break;
          case "message_delta":
            stopReason = event.delta.stop_reason;
            usage.output = event.usage.output_tokens;
            break;
        }
      }
    } catch (error) {
      throw timeout.aborted && signal?.aborted !== true ? new ClaudeFailure("timeout") : classifyError(error, signal);
    }
    yield { type: "end", stopReason, usage };
  };
}

function citedDocument(citation: Anthropic.TextCitation): number[] {
  return citation.type === "char_location" ? [citation.document_index] : [];
}
