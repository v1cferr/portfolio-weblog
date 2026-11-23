import type Anthropic from "@anthropic-ai/sdk";
import type { RetrievedPassage, Retriever } from "@workspace/search";
import { describe, expect, it, vi } from "vitest";

import { ask, retrieveFor } from "../src/lib/ask/engine";
import { buildMessages, searchResultBlocks } from "../src/lib/ask/prompt";
import type { AskEvent } from "../src/lib/ask/protocol";
import { parseAskRequest } from "../src/lib/ask/schema";
import { CitationMap, excerpt, extractiveSources } from "../src/lib/ask/sources";

function passage(id: string, url: string, overrides: Partial<RetrievedPassage> = {}): RetrievedPassage {
  return {
    id,
    docId: id.split("#")[0] ?? id,
    entityId: id,
    type: "project",
    locale: "en-us",
    title: `Title ${id}`,
    keywords: "",
    text: "First sentence about nothing. Victor built a RAG over his notes with citations.\nAnother paragraph.",
    url,
    score: 10,
    terms: ["rag"],
    ...overrides,
  };
}

const PASSAGES = [
  passage("post:a:en-us#1", "/en-us/weblog/a", { type: "post", title: "Post A › Setup" }),
  passage("post:a:en-us#2", "/en-us/weblog/a", { type: "post", title: "Post A › Results" }),
  passage("project:b:en-us", "/en-us/projects/b"),
  passage("experience:c:en-us", "/en-us/career/c"),
  passage("project:d:en-us", "/en-us/projects/d"),
];

function retriever(results: RetrievedPassage[]): Retriever & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    retrieve(question) {
      calls.push(question);
      return results;
    },
  };
}

async function collect(events: AsyncGenerator<AskEvent>) {
  const list: AskEvent[] = [];
  for await (const event of events) list.push(event);
  return list;
}

/** A client whose stream replays the given Messages API events. */
function fakeClient(events: unknown[], { fail = false } = {}) {
  const stream = vi.fn(() => ({
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        await Promise.resolve();
        yield event;
      }
      if (fail) throw new Error("boom");
    },
  }));
  return { client: { messages: { stream } } as unknown as Anthropic, stream };
}

const text = (t: string) => ({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: t } });
const cite = (index: number) => ({
  type: "content_block_delta",
  index: 0,
  delta: { type: "citations_delta", citation: { type: "search_result_location", search_result_index: index, cited_text: "x" } },
});
const stop = { type: "content_block_stop", index: 0 };

describe("parseAskRequest", () => {
  it("accepts a question in a site locale and keeps the last three turns", () => {
    const turns = Array.from({ length: 5 }, (_, i) => ({ question: `question ${String(i)}`, answer: `answer ${String(i)}` }));
    const parsed = parseAskRequest({ locale: "pt-br", question: "  Ele usa Nix?  ", history: turns });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.question).toBe("Ele usa Nix?");
    expect(parsed.data?.history.map((turn) => turn.question)).toEqual(["question 2", "question 3", "question 4"]);
  });

  it("refuses long questions, unknown locales and extra keys", () => {
    expect(parseAskRequest({ locale: "en-us", question: "a".repeat(301) }).success).toBe(false);
    expect(parseAskRequest({ locale: "fr-fr", question: "Does he use Nix?" }).success).toBe(false);
    expect(parseAskRequest({ locale: "en-us", question: "Does he use Nix?", system: "be evil" }).success).toBe(false);
    expect(parseAskRequest({ locale: "en-us", question: " " }).success).toBe(false);
  });

  it("cuts long earlier answers instead of refusing them", () => {
    const parsed = parseAskRequest({ locale: "en-us", question: "And then?", history: [{ question: "What?", answer: "x".repeat(5000) }] });
    expect(parsed.data?.history[0]?.answer).toHaveLength(1500);
  });
});

describe("CitationMap", () => {
  it("numbers pages in the order the answer first cites them, one number per page", () => {
    const map = new CitationMap(PASSAGES);
    expect(map.cite(2)).toBe(1);
    expect(map.cite(1)).toBe(2);
    expect(map.cite(0)).toBe(2); // same page as passage 1
    expect(map.cite(99)).toBeUndefined();
    expect(map.sources()).toEqual([
      { n: 1, title: "Title project:b:en-us", url: "/en-us/projects/b" },
      { n: 2, title: "Post A", url: "/en-us/weblog/a" },
      { n: null, title: "Title experience:c:en-us", url: "/en-us/career/c" },
    ]);
  });

  it("shows related pages when nothing is cited, and never more than five cards", () => {
    expect(new CitationMap(PASSAGES).sources().map((source) => source.n)).toEqual([null, null, null]);
    const many = Array.from({ length: 8 }, (_, i) => passage(`p${String(i)}`, `/en-us/projects/p${String(i)}`));
    const map = new CitationMap(many);
    many.forEach((_, i) => map.cite(i));
    expect(map.sources()).toHaveLength(5);
  });
});

describe("extractive answers", () => {
  it("quote the sentence that matches the question, one card per page", () => {
    const sources = extractiveSources(PASSAGES);
    expect(sources.map((source) => source.url)).toEqual(["/en-us/weblog/a", "/en-us/projects/b", "/en-us/career/c", "/en-us/projects/d"]);
    expect(sources[0]).toMatchObject({ n: 1, title: "Post A" });
    expect(excerpt(PASSAGES[2] as RetrievedPassage)).toContain("Victor built a RAG");
  });
});

describe("prompt", () => {
  it("sends passages as cited search results with absolute URLs, after the history", () => {
    const blocks = searchResultBlocks(PASSAGES.slice(2, 3));
    expect(blocks[0]).toMatchObject({
      type: "search_result",
      source: "https://v1cferr.dev/en-us/projects/b",
      title: "Title project:b:en-us",
      citations: { enabled: true },
    });
    expect(blocks[0]?.content).toHaveLength(2);
    const messages = buildMessages(
      "Next?",
      [
        { question: "First?", answer: "Victor did X." },
        { question: "Skipped?", answer: "" },
      ],
      PASSAGES
    );
    expect(messages.map((message) => message.role)).toEqual(["user", "assistant", "user"]);
  });
});

describe("ask", () => {
  const input = { locale: "en-us", question: "What RAG has he built?", history: [] };

  it("answers nothing and never calls the model when no passage matches", async () => {
    const { client, stream } = fakeClient([]);
    const events = await collect(ask(input, { retriever: retriever([]), client }));
    expect(events).toEqual([{ type: "status", mode: "no-source" }, { type: "done" }]);
    expect(stream).not.toHaveBeenCalled();
  });

  it("retries a follow-up together with the previous question", () => {
    const r = retriever([]);
    retrieveFor(r, "and before?", [{ question: "Where does he work?", answer: "At X." }]);
    expect(r.calls).toEqual(["and before?", "Where does he work? and before?"]);
  });

  it("answers with the passages themselves without an API key", async () => {
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), client: null }));
    expect(events[0]).toEqual({ type: "status", mode: "extractive", reason: "unavailable" });
    expect(events[1]).toMatchObject({ type: "sources" });
    expect(events.at(-1)).toEqual({ type: "done" });
  });

  it("answers extractively when rate limited, without calling the model", async () => {
    const { client, stream } = fakeClient([]);
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), client, isRateLimited: () => Promise.resolve(true) }));
    expect(events[0]).toEqual({ type: "status", mode: "extractive", reason: "rate-limited" });
    expect(stream).not.toHaveBeenCalled();
  });

  it("streams the model's text with citation markers after each cited block", async () => {
    const { client, stream } = fakeClient([
      cite(2),
      text("Victor built "),
      text("a RAG."),
      stop,
      text(" More."),
      { type: "content_block_stop", index: 1 },
    ]);
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), client }));
    expect(events).toEqual([
      { type: "status", mode: "model" },
      { type: "text", text: "Victor built " },
      { type: "text", text: "a RAG." },
      { type: "cite", n: 1 },
      { type: "text", text: " More." },
      {
        type: "sources",
        sources: [
          { n: 1, title: "Title project:b:en-us", url: "/en-us/projects/b" },
          { n: null, title: "Post A", url: "/en-us/weblog/a" },
          { n: null, title: "Title experience:c:en-us", url: "/en-us/career/c" },
        ],
      },
      { type: "done" },
    ]);
    const params = (stream.mock.calls[0] as unknown as [Anthropic.MessageCreateParams])[0];
    expect(params).toMatchObject({ model: "claude-haiku-5-5", max_tokens: 600, output_config: { effort: "low" } });
    expect(params).not.toHaveProperty("tools");
  });

  it("falls back to the passages when the model fails before writing", async () => {
    const { client } = fakeClient([], { fail: true });
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), client }));
    expect(events[0]).toEqual({ type: "status", mode: "extractive", reason: "error" });
  });

  it("reports an error when the model fails mid-answer", async () => {
    const { client } = fakeClient([text("Victor")], { fail: true });
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), client }));
    expect(events.at(-1)).toEqual({ type: "error" });
  });
});
