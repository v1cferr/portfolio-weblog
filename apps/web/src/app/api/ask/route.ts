import { ask, openRouterGenerate } from "@/lib/ask/engine";
import { getApiKey } from "@/lib/ask/openrouter";
import { parseAskRequest } from "@/lib/ask/schema";
import { getRetriever, isRateLimited } from "@/lib/ask/server";

/**
 * The profile chat (ADR 0011): answers a question about the owner from the
 * site's own pages, sent as NDJSON (lib/ask/protocol.ts). Questions are
 * never stored or logged; logs carry reason codes only.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Largest body accepted, in bytes: a 300-character question and three short turns fit with room to spare. */
const MAX_BODY = 16_384;

function log(message: string) {
  console.warn(`[ask] ${message}`);
}

export async function POST(request: Request) {
  // Same-origin only: the panel calls this from the site's own pages.
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return new Response("Forbidden", { status: 403 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response("Payload too large", { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = parseAskRequest(body);
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const { locale, question, history } = parsed.data;
  const apiKey = getApiKey();
  const events = ask(
    { locale, question, history },
    {
      retriever: getRetriever(locale),
      generate: apiKey === null ? null : openRouterGenerate(apiKey),
      isRateLimited: () => isRateLimited(request),
      signal: request.signal,
      log,
    }
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      } catch {
        log("stream_failed");
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error" })}\n`));
        controller.close();
      }
    },
    async cancel() {
      await events.return(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
