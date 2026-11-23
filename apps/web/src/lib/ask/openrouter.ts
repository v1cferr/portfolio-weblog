/**
 * OpenRouter's OpenAI-compatible Chat Completions API, with plain fetch
 * (ADR 0011). Free models only: this site never pays for inference.
 */

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * The models tried, in order. FREE ONLY: every id must end in `:free` or be
 * `openrouter/free` (which itself only routes to free models). A paid id here
 * would be billed whenever the free ones cannot serve a request, so paid ids
 * are forbidden; test/profile-chat.test.ts enforces it. All of these support
 * structured outputs (checked on https://openrouter.ai/api/v1/models,
 * 2026-11-23).
 */
export const FREE_MODELS = [
  "nvidia/nemotron-3.5-super-vl:free",
  "baidu/ernie-5.5-flash-preview:free",
  "inclusionai/ling-3.2-flash:free",
  "openrouter/free",
] as const;

/** OpenRouter accepts a short fallback list per request; longer chains are walked by the caller. */
const MODELS_PER_REQUEST = 3;

export const MAX_TOKENS = 700;
/** Time for the whole answer, every attempt included. */
export const TIMEOUT_MS = 20_000;

export function isFreeModel(id: string): boolean {
  return id.endsWith(":free") || id === "openrouter/free";
}

/** The API key, or null without OPENROUTER_API_KEY: the chat then answers extractively. Server only. */
export function getApiKey(): string | null {
  const key = process.env.OPENROUTER_API_KEY;
  return key === undefined || key === "" ? null : key;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type CompletionResult =
  { ok: true; content: string; model: string } | { ok: false; reason: "timeout" | "aborted" | "http" | "empty"; status?: number };

/** Statuses worth another model: rate limited, no endpoint, upstream errors. 402 (credits) and 4xx request errors are not. */
function retryable(status: number): boolean {
  return status === 404 || status === 408 || status === 429 || status >= 500;
}

interface ChatCompletionResponse {
  model?: string;
  choices?: { message?: { content?: string | null }; finish_reason?: string | null }[];
  error?: { code?: number; message?: string };
}

/**
 * One structured answer from the first free model that gives one. Each
 * request carries up to three models for OpenRouter's own fallback; when a
 * request still fails with a retryable status, the next models are tried
 * until the time runs out.
 */
export async function complete(options: {
  apiKey: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  signal?: AbortSignal;
  models?: readonly string[];
  fetchImpl?: typeof fetch;
  now?: () => number;
}): Promise<CompletionResult> {
  const { apiKey, messages, schema, signal, models = FREE_MODELS, fetchImpl = fetch, now = Date.now } = options;
  const free = models.filter(isFreeModel);
  const deadline = now() + TIMEOUT_MS;
  let last: CompletionResult = { ok: false, reason: "empty" };

  for (let start = 0; start < free.length; start += MODELS_PER_REQUEST) {
    const remaining = deadline - now();
    if (remaining <= 0) return { ok: false, reason: "timeout" };
    const timeout = AbortSignal.timeout(remaining);
    let response: Response;
    try {
      response = await fetchImpl(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://v1cferr.dev",
          "X-Title": "v1cferr.dev",
        },
        body: JSON.stringify({
          models: free.slice(start, start + MODELS_PER_REQUEST),
          messages,
          max_tokens: MAX_TOKENS,
          response_format: { type: "json_schema", json_schema: { name: "grounded_answer", strict: true, schema } },
          // Only endpoints that honour the schema; never a paid fallback.
          provider: { require_parameters: true },
        }),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    } catch {
      if (signal?.aborted === true) return { ok: false, reason: "aborted" };
      return { ok: false, reason: "timeout" };
    }
    if (!response.ok) {
      last = { ok: false, reason: "http", status: response.status };
      if (retryable(response.status)) continue;
      return last;
    }
    const body = (await response.json().catch(() => ({}))) as ChatCompletionResponse;
    const content = body.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim() !== "") return { ok: true, content, model: body.model ?? "unknown" };
    // A 200 can still carry an upstream error or an empty message: try the next models.
    last = { ok: false, reason: "empty", ...(body.error?.code !== undefined && { status: body.error.code }) };
  }
  return last;
}
