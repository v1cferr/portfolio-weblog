import type { AskEvent, AskMode, AskSource, FallbackReason } from "@/lib/ask/protocol";

export type Part = { type: "text"; text: string } | { type: "cite"; n: number };

/** One question of the conversation and its answer, as it streams in. */
export interface Turn {
  id: number;
  question: string;
  phase: "searching" | "streaming" | "done" | "stopped" | "failed";
  mode?: AskMode;
  reason?: FallbackReason;
  /** A model answer that covers only part of the question. */
  partial?: boolean;
  /** The pages the model is reading, shown while it thinks. */
  reading?: { title: string; url: string }[];
  /** The model read the whole site (`reading` then lists the pages the question is most about). */
  readSite?: boolean;
  /** The model replied and its answer was checked against the pages (the `checking` event). */
  checked?: boolean;
  /** When the question was sent (epoch ms), for the elapsed time while the answer is written. */
  startedAt?: number;
  /** How long the answer took to arrive, in ms; kept so a restored turn still shows its summary. */
  elapsedMs?: number;
  parts: Part[];
  sources: AskSource[];
  /** One-tap follow-up questions offered under the answer. */
  suggestions?: string[];
  /** The model failed after it had started writing. */
  interrupted?: boolean;
}

export function isBusy(turn: Turn) {
  return turn.phase === "searching" || turn.phase === "streaming";
}

/** The answer text without its citation markers, for the next question's history. */
export function answerText(turn: Turn): string {
  return turn.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/** The link target a citation marker gets in the answer's Markdown; the panel renders it as a numbered source. */
export const CITE_HREF = /^#cite-(\d+)$/;

/**
 * The answer as one Markdown text: the model's text as it came, and each
 * citation as a `[n](#cite-n)` link right after the sentence it backs, before
 * the sentence's trailing spaces or line break, so it stays on that line (a
 * list item's marker would otherwise move to the next one). Model text never
 * carries links of its own: the server strips them.
 */
export function toMarkdown(parts: readonly Part[]): string {
  let markdown = "";
  for (const part of parts) {
    if (part.type === "text") {
      markdown += part.text;
      continue;
    }
    const trailing = /\s*$/.exec(markdown)?.[0] ?? "";
    const marker = `[${String(part.n)}](#cite-${String(part.n)})`;
    markdown = `${markdown.slice(0, markdown.length - trailing.length)}${marker}${trailing}`;
  }
  return markdown;
}

/** Reads POST /api/ask's NDJSON stream, one event per line. */
export async function* readEvents(response: Response): AsyncGenerator<AskEvent> {
  if (!response.body) return;
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim() !== "") yield JSON.parse(line) as AskEvent;
  }
  if (buffer.trim() !== "") yield JSON.parse(buffer) as AskEvent;
}

/**
 * Turns read back from sessionStorage. Anything that does not look like a turn
 * is dropped, and an answer that was still streaming when the page went away
 * (a reload) is marked stopped, since its request is gone.
 */
export function restoreTurns(raw: string | null): Turn[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Turn =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Turn).id === "number" &&
          typeof (item as Turn).question === "string" &&
          Array.isArray((item as Turn).parts) &&
          Array.isArray((item as Turn).sources)
      )
      .map((turn) => (isBusy(turn) ? { ...turn, phase: "stopped" as const } : turn));
  } catch {
    return [];
  }
}
