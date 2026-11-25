import type { RetrievedPassage, Retriever } from "@workspace/search";
import { describe, expect, it, vi } from "vitest";

import { ask, type Generate, retrieveFor } from "../src/lib/ask/engine";
import { faithfulness, groundAnswer, parseModelAnswer, plainText } from "../src/lib/ask/grounding";
import { complete, FREE_MODELS, isFreeModel, MAX_TOKENS, MODEL_REASONING, OPENROUTER_URL, TIMEOUT_MS } from "../src/lib/ask/openrouter";
import { buildMessages, passagesBlock } from "../src/lib/ask/prompt";
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
  passage("project:b:en-us", "/en-us/projects/b", {
    title: "obsidian-rag",
    text: "Personal RAG chatbot over an Obsidian vault. Answers cite the note they came from, and nothing leaves the machine.",
  }),
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

/** A model that always replies with `content`. */
function fakeModel(content: string | null) {
  const generate = vi.fn<Generate>(() =>
    Promise.resolve(
      content === null ? { ok: false as const, reason: "http" as const, status: 429 } : { ok: true as const, content, model: "test:free" }
    )
  );
  return generate;
}

const answer = (sentences: { text: string; sources: number[] }[], answerable = true, incomplete = false) =>
  JSON.stringify({ answerable, incomplete, sentences });

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
      { n: 1, title: "obsidian-rag", url: "/en-us/projects/b" },
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
    expect(excerpt(PASSAGES[0] as RetrievedPassage)).toContain("Victor built a RAG");
  });
});

describe("OpenRouter models", () => {
  it("are free only: every id ends in :free or is the free router", () => {
    expect(FREE_MODELS.length).toBeGreaterThan(0);
    for (const id of FREE_MODELS) expect(id.endsWith(":free") || id === "openrouter/free", id).toBe(true);
    expect(isFreeModel("openai/gpt-5")).toBe(false);
    for (const id of Object.keys(MODEL_REASONING)) expect(FREE_MODELS as readonly string[]).toContain(id);
  });

  it("sends a strict JSON schema, free models only, the attribution headers and no paid fallback", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json({ model: "x:free", choices: [{ message: { content: '{"answerable":false,"sentences":[]}' } }] }))
    );
    const result = await complete({
      apiKey: "k",
      messages: [],
      schema: { type: "object" },
      fetchImpl,
      models: [...FREE_MODELS, "openai/gpt-5"],
    });
    expect(result).toMatchObject({ ok: true, model: "x:free" });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(OPENROUTER_URL);
    const headers = init?.headers as Record<string, string>;
    expect(headers["HTTP-Referer"]).toBe("https://v1cferr.dev");
    expect(headers["X-Title"]).toBe("v1cferr.dev");
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(body).toMatchObject({
      max_tokens: MAX_TOKENS,
      provider: { require_parameters: true },
      response_format: { type: "json_schema", json_schema: { strict: true } },
    });
    expect(body).not.toHaveProperty("model");
    expect(body.models).toEqual([FREE_MODELS[0]]);
  });

  it("sends each model its own reasoning setting, and none to the others", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => Promise.resolve(new Response("{}", { status: 429 })));
    const off = Object.keys(MODEL_REASONING)[0] ?? "";
    await complete({ apiKey: "k", messages: [], schema: {}, fetchImpl, models: ["plain:free", off] });
    const bodies = fetchImpl.mock.calls.map(([, init]) => JSON.parse(init?.body as string) as Record<string, unknown>);
    expect(bodies[0]).not.toHaveProperty("reasoning");
    expect(bodies[1]?.reasoning).toEqual(MODEL_REASONING[off]);
  });

  it("tries the next free models on 429 and 5xx, and stops on 402", async () => {
    const statuses = [429, 503];
    const fetchImpl = vi.fn<typeof fetch>(() => Promise.resolve(new Response("{}", { status: statuses.shift() ?? 500 })));
    const models = ["a:free", "b:free", "c:free", "d:free", "e:free", "f:free", "g:free"];
    expect(await complete({ apiKey: "k", messages: [], schema: {}, fetchImpl, models })).toMatchObject({ ok: false, status: 500 });
    // One model per request: 429, 503 and every 500 after them move on, through all seven.
    expect(fetchImpl).toHaveBeenCalledTimes(7);
    const payment = vi.fn<typeof fetch>(() => Promise.resolve(new Response("{}", { status: 402 })));
    expect(await complete({ apiKey: "k", messages: [], schema: {}, fetchImpl: payment, models })).toMatchObject({ ok: false, status: 402 });
    expect(payment).toHaveBeenCalledTimes(1);
  });

  it("tries the next free models when a reply is refused by accept", async () => {
    const replies = ["not json", '{"answerable":true,"incomplete":false,"sentences":[]}'];
    const fetchImpl = vi.fn(() =>
      Promise.resolve(Response.json({ model: "x:free", choices: [{ message: { content: replies.shift() ?? "" } }] }))
    );
    const models = ["a:free", "b:free", "c:free", "d:free"];
    const result = await complete({
      apiKey: "k",
      messages: [],
      schema: {},
      models,
      fetchImpl,
      accept: (content) => content.startsWith("{"),
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ ok: true });
  });

  it("gives up when the time is spent", async () => {
    let clock = 0;
    const fetchImpl = vi.fn<typeof fetch>(() => {
      clock += TIMEOUT_MS + 1;
      return Promise.resolve(new Response("{}", { status: 429 }));
    });
    const result = await complete({
      apiKey: "k",
      messages: [],
      schema: {},
      fetchImpl,
      models: ["a:free", "b:free", "c:free", "d:free"],
      now: () => clock,
    });
    expect(result).toEqual({ ok: false, reason: "timeout" });
  });
});

describe("prompt", () => {
  it("numbers passages with title and text only, never their URLs, after the history", () => {
    const block = passagesBlock(PASSAGES.slice(2, 4));
    expect(block).toMatch(/^\[1\] obsidian-rag\nPersonal RAG/);
    expect(block).toContain("[2] Title experience:c:en-us");
    expect(block).not.toMatch(/\/en-us\/|https?:/);
    const messages = buildMessages(
      "en-us",
      "Next?",
      [
        { question: "First?", answer: "Victor did X." },
        { question: "Skipped?", answer: "" },
      ],
      PASSAGES
    );
    expect(messages.map((message) => message.role)).toEqual(["system", "user", "assistant", "user"]);
    expect(messages.at(-1)?.content).toMatch(/Question: Next\?$/);
  });
});

describe("grounding", () => {
  it("parses the schema, with or without a code fence, and refuses anything else", () => {
    expect(parseModelAnswer('```json\n{"answerable":true,"sentences":[]}\n```')).toEqual({
      answerable: true,
      incomplete: false,
      sentences: [],
    });
    expect(parseModelAnswer("Victor built a RAG.")).toBeNull();
    expect(parseModelAnswer('{"answerable":"yes"}')).toBeNull();
  });

  it("strips links, URLs, Markdown and bracketed numbers", () => {
    expect(plainText("**Victor** built [obsidian-rag](https://evil.example) see https://x.y/z [1]")).toBe("Victor built obsidian-rag see");
  });

  it("keeps sentences that cite real passages and stay close to them", () => {
    const result = groundAnswer(
      answer([
        { text: "Victor built a personal RAG chatbot over an Obsidian vault.", sources: [3] },
        { text: "Answers cite the note they came from.", sources: [3, 3] },
      ]),
      PASSAGES
    );
    expect(result?.sentences).toEqual([
      { text: "Victor built a personal RAG chatbot over an Obsidian vault.", passages: [2] },
      { text: "Answers cite the note they came from.", passages: [2] },
    ]);
  });

  it("drops sentences without sources, with unknown sources, or not supported by what they cite", () => {
    const result = groundAnswer(
      answer([
        { text: "Victor built a RAG chatbot.", sources: [] },
        { text: "Victor built a RAG chatbot.", sources: [9] },
        { text: "Victor built a RAG chatbot.", sources: [0] },
        { text: "Victor earns a large salary at Google as a principal engineer in Zurich.", sources: [3] },
      ]),
      PASSAGES
    );
    expect(result?.sentences).toEqual([]);
    expect(result?.dropped).toEqual(["no-sources", "bad-source", "bad-source", "unfaithful"]);
  });

  it("keeps nothing when the model says the passages do not answer", () => {
    expect(groundAnswer(answer([{ text: "Personal RAG chatbot.", sources: [3] }], false), PASSAGES)?.sentences).toEqual([]);
  });

  it("scores faithfulness on content words, accent-folded, with shared stems", () => {
    expect(faithfulness("Ele construiu projetos com Nix", [{ title: "Nix", keywords: "", text: "Construiu um projeto com Nix" }])).toBe(1);
    expect(faithfulness("Victor works at NASA on rockets", [{ title: "x", keywords: "", text: "Victor works with Nix." }])).toBeLessThan(
      0.5
    );
  });
});

describe("ask", () => {
  const input = { locale: "en-us", question: "What RAG has he built?", history: [] };

  it("answers nothing and never calls the model when no passage matches", async () => {
    const generate = fakeModel(answer([]));
    const events = await collect(ask(input, { retriever: retriever([]), generate }));
    expect(events).toEqual([{ type: "status", mode: "no-source" }, { type: "done" }]);
    expect(generate).not.toHaveBeenCalled();
  });

  it("retries a follow-up together with the previous question", () => {
    const r = retriever([]);
    retrieveFor(r, "and before?", [{ question: "Where does he work?", answer: "At X." }]);
    expect(r.calls).toEqual(["and before?", "Where does he work? and before?"]);
  });

  it("answers with the passages themselves without an API key", async () => {
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), generate: null }));
    expect(events[0]).toEqual({ type: "status", mode: "extractive", reason: "unavailable" });
    expect(events[1]).toMatchObject({ type: "sources" });
    expect(events.at(-1)).toEqual({ type: "done" });
  });

  it("answers extractively when rate limited, without calling the model", async () => {
    const generate = fakeModel(answer([]));
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), generate, isRateLimited: () => Promise.resolve(true) }));
    expect(events[0]).toEqual({ type: "status", mode: "extractive", reason: "rate-limited" });
    expect(generate).not.toHaveBeenCalled();
  });

  it("sends only checked sentences, each followed by the numbers of the pages it cites", async () => {
    const generate = fakeModel(
      answer([
        { text: "Victor built a personal RAG chatbot over an Obsidian vault.", sources: [3] },
        { text: "He also won the Nobel Prize in physics.", sources: [3] },
        { text: "Victor built a RAG over his notes with citations.", sources: [1, 2] },
      ])
    );
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), generate }));
    expect(events).toEqual([
      // The Nobel sentence was dropped, so the answer is marked partial.
      { type: "status", mode: "model", partial: true },
      { type: "text", text: "Victor built a personal RAG chatbot over an Obsidian vault." },
      { type: "cite", n: 1 },
      { type: "text", text: " Victor built a RAG over his notes with citations." },
      { type: "cite", n: 2 },
      {
        type: "sources",
        sources: [
          { n: 1, title: "obsidian-rag", url: "/en-us/projects/b" },
          { n: 2, title: "Post A", url: "/en-us/weblog/a" },
          { n: null, title: "Title experience:c:en-us", url: "/en-us/career/c" },
        ],
      },
      { type: "done" },
    ]);
  });

  it("marks an answer partial when the model says the passages cover only part of the question", async () => {
    const full = await collect(
      ask(input, {
        retriever: retriever(PASSAGES),
        generate: fakeModel(answer([{ text: "Victor built a RAG over his notes.", sources: [1] }])),
      })
    );
    expect(full[0]).toEqual({ type: "status", mode: "model" });
    const part = await collect(
      ask(input, {
        retriever: retriever(PASSAGES),
        generate: fakeModel(answer([{ text: "Victor built a RAG over his notes.", sources: [1] }], true, true)),
      })
    );
    expect(part[0]).toEqual({ type: "status", mode: "model", partial: true });
  });

  it("says the site does not know, with the pages it read, when the model finds no answer in them", async () => {
    const events = await collect(ask(input, { retriever: retriever(PASSAGES), generate: fakeModel(answer([], false)) }));
    expect(events[0]).toEqual({ type: "status", mode: "unknown" });
    expect(events.some((event) => event.type === "text")).toBe(false);
    const sources = events.find((event) => event.type === "sources");
    expect(sources?.type === "sources" && sources.sources.length).toBeGreaterThan(0);
    expect(events.at(-1)).toEqual({ type: "done" });
  });

  it("falls back to the passages when the model fails, replies off-schema, or nothing survives the checks", async () => {
    for (const [generate, reason] of [
      [fakeModel(null), "error"],
      [fakeModel("Sure! Victor is great."), "error"],
      [fakeModel(answer([{ text: "Victor lives on the Moon with penguins.", sources: [1] }])), "ungrounded"],
    ] as const) {
      const events = await collect(ask(input, { retriever: retriever(PASSAGES), generate }));
      expect(events[0]).toEqual({ type: "status", mode: "extractive", reason });
    }
  });
});
