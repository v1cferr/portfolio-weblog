"use client";

import { Button } from "@workspace/ui/components/button";
import { ArrowUpIcon, InfoIcon, SearchIcon, SquareIcon, UserRoundIcon } from "lucide-react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, type SyntheticEvent, useEffect, useRef, useState } from "react";

import {
  type AskEvent,
  type AskMode,
  type AskSource,
  type AskTurn,
  type FallbackReason,
  MAX_HISTORY,
  MAX_QUESTION,
} from "@/lib/ask/protocol";

type Part = { type: "text"; text: string } | { type: "cite"; n: number };

interface Turn {
  id: number;
  question: string;
  phase: "searching" | "streaming" | "done" | "stopped" | "failed";
  mode?: AskMode;
  reason?: FallbackReason;
  /** A model answer that covers only part of the question. */
  partial?: boolean;
  parts: Part[];
  sources: AskSource[];
  /** The model failed after it had started writing. */
  interrupted?: boolean;
}

/** The answer text without its citation markers, for the next question's history. */
function answerText(turn: Turn): string {
  return turn.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

async function* readEvents(response: Response): AsyncGenerator<AskEvent> {
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
 * The profile chat (ADR 0011): a question box, suggested questions, and the
 * answers with numbered citations and source cards. Answers come from
 * POST /api/ask, same origin; without a model they are the site's passages.
 */
export function AskPanel({ onNavigate, onSearch }: { onNavigate: () => void; onSearch: (question: string) => void }) {
  const t = useTranslations("Ask");
  const locale = useLocale();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef<HTMLLIElement>(null);
  const nextId = useRef(0);
  const suggestions = t.raw("suggestions") as string[];
  const busy = turns.some((turn) => turn.phase === "searching" || turn.phase === "streaming");

  // Stop any answer still streaming when the panel goes away.
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    []
  );

  // A new question scrolls to its own top, so it is read from the start rather than from the last source card.
  useEffect(() => {
    if (turns.length === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    latest.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [turns.length]);

  function update(id: number, change: (turn: Turn) => Turn) {
    setTurns((list) => list.map((turn) => (turn.id === id ? change(turn) : turn)));
  }

  async function submit(text: string) {
    const asked = text.trim().slice(0, MAX_QUESTION);
    if (asked.length < 2 || busy) return;
    const id = nextId.current++;
    const history: AskTurn[] = turns
      .filter((turn) => turn.mode === "model" && turn.phase === "done")
      .slice(-MAX_HISTORY)
      .map((turn) => ({ question: turn.question, answer: answerText(turn) }));
    setTurns((list) => [...list, { id, question: asked, phase: "searching", parts: [], sources: [] }]);
    setQuestion("");
    setAnnouncement(t("status.searching"));
    input.current?.focus();

    const abort = new AbortController();
    controller.current = abort;
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, question: asked, history }),
        signal: abort.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
      let finished = false;
      let mode: AskMode | undefined;
      for await (const event of readEvents(response)) {
        switch (event.type) {
          case "status":
            mode = event.mode;
            update(id, (turn) => ({
              ...turn,
              phase: "streaming",
              mode: event.mode,
              ...(event.reason && { reason: event.reason }),
              ...(event.partial && { partial: true }),
            }));
            if (event.mode === "no-source" || event.mode === "unknown") setAnnouncement(t("status.noSource"));
            break;
          case "text":
            update(id, (turn) => {
              const last = turn.parts.at(-1);
              const parts: Part[] =
                last?.type === "text"
                  ? [...turn.parts.slice(0, -1), { type: "text", text: last.text + event.text }]
                  : [...turn.parts, event];
              return { ...turn, parts };
            });
            break;
          case "cite":
            update(id, (turn) => ({ ...turn, parts: [...turn.parts, event] }));
            break;
          case "sources":
            update(id, (turn) => ({ ...turn, sources: event.sources }));
            break;
          case "error":
            update(id, (turn) => ({ ...turn, interrupted: true }));
            break;
          case "done":
            finished = true;
            break;
        }
      }
      update(id, (turn) => ({ ...turn, phase: "done", interrupted: turn.interrupted === true || !finished }));
      if (mode !== "no-source" && mode !== "unknown") setAnnouncement(t("status.ready"));
    } catch {
      if (abort.signal.aborted) {
        update(id, (turn) => ({ ...turn, phase: "stopped" }));
        setAnnouncement(t("status.stopped"));
      } else {
        update(id, (turn) => ({ ...turn, phase: "failed" }));
        setAnnouncement(t("status.error"));
      }
    } finally {
      if (controller.current === abort) controller.current = null;
    }
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(question);
  }

  function stop() {
    controller.current?.abort();
    input.current?.focus();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* State changes only (searching, answer ready, nothing found); the answer text itself is not read out as it streams. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:max-h-[60vh] sm:px-4">
        {turns.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t("description")}</p>
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("suggestionsTitle")}</h3>
            <ul className="flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => {
                      void submit(suggestion);
                    }}
                    className="flex min-h-11 w-full items-center rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="flex flex-col gap-6" aria-label={t("title")}>
            {turns.map((turn, index) => (
              <li key={turn.id} ref={index === turns.length - 1 ? latest : undefined} className="flex scroll-mt-3 flex-col gap-3">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <UserRoundIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="sr-only">{t("you")}: </span>
                  <span className="min-w-0 break-words">{turn.question}</span>
                </p>
                <Answer turn={turn} onNavigate={onNavigate} onSearch={onSearch} />
              </li>
            ))}
          </ol>
        )}
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-1 border-t p-2 sm:p-3">
        <div className="flex items-center gap-2">
          <label htmlFor="ask-question" className="sr-only">
            {t("title")}
          </label>
          <input
            ref={input}
            id="ask-question"
            data-autofocus
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            maxLength={MAX_QUESTION}
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
            placeholder={t("placeholder")}
            aria-describedby="ask-privacy ask-counter"
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-input/30 px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
          />
          {busy ? (
            <Button type="button" variant="outline" onClick={stop} className="h-11 gap-1.5 px-3">
              <SquareIcon aria-hidden className="fill-current" />
              {t("stop")}
            </Button>
          ) : (
            <Button type="submit" disabled={question.trim().length < 2} className="h-11 gap-1.5 px-3">
              <ArrowUpIcon aria-hidden />
              {t("submit")}
            </Button>
          )}
        </div>
        <div className="flex items-start justify-between gap-3 px-1 text-xs text-muted-foreground">
          <p id="ask-privacy">{t("privacy")}</p>
          <p id="ask-counter" className="shrink-0 tabular-nums">
            {t("counter", { count: question.length, max: MAX_QUESTION })}
          </p>
        </div>
      </form>
    </div>
  );
}

function Answer({ turn, onNavigate, onSearch }: { turn: Turn; onNavigate: () => void; onSearch: (question: string) => void }) {
  const t = useTranslations("Ask");
  const locale = useLocale();
  const streaming = turn.phase === "searching" || turn.phase === "streaming";
  const byNumber = new Map(turn.sources.flatMap((source) => (source.n === null ? [] : [[source.n, source] as const])));

  if (turn.phase === "searching") {
    return (
      <p aria-busy="true" className="text-sm text-muted-foreground motion-safe:animate-pulse">
        {t("status.searching")}
      </p>
    );
  }
  if (turn.phase === "failed") {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("error")}
      </p>
    );
  }

  if (turn.mode === "no-source") {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 text-sm" data-testid="ask-no-source">
        <p className="font-medium">{t("noSource.title")}</p>
        <p className="text-muted-foreground">{t("noSource.body")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-1.5"
            onClick={() => {
              onSearch(turn.question);
            }}
          >
            <SearchIcon aria-hidden />
            {t("noSource.search")}
          </Button>
          <Button asChild variant="outline" className="h-11">
            <NextLink href={`/${locale}/about`} onClick={onNavigate}>
              {t("noSource.about")}
            </NextLink>
          </Button>
        </div>
      </div>
    );
  }

  if (turn.mode === "unknown") {
    return (
      <div className="flex flex-col gap-2" data-testid="ask-unknown">
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium">{t("unknown.title")}</p>
          <p className="text-muted-foreground">{t("unknown.body")}</p>
        </div>
        {turn.sources.length > 0 && <SourceList sources={turn.sources} onNavigate={onNavigate} heading={t("unknown.read")} />}
      </div>
    );
  }

  if (turn.mode === "extractive") {
    return (
      <div className="flex flex-col gap-2" data-testid="ask-extractive">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground">{t("extractive.label")}.</span> {t(`extractive.${turn.reason ?? "unavailable"}`)}
          </span>
        </p>
        <SourceList sources={turn.sources} onNavigate={onNavigate} heading={t("sources")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={streaming} data-testid="ask-answer">
      <p className="text-sm leading-relaxed whitespace-pre-line">
        {turn.parts.map((part, index) =>
          part.type === "text" ? (
            <Fragment key={index}>{part.text}</Fragment>
          ) : (
            <Citation key={index} n={part.n} source={byNumber.get(part.n)} onNavigate={onNavigate} />
          )
        )}
      </p>
      {turn.partial === true && !streaming && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground" data-testid="ask-partial">
          <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{t("partial")}</span>
        </p>
      )}
      {turn.phase === "stopped" && <p className="text-xs text-muted-foreground">{t("stoppedNote")}</p>}
      {turn.interrupted === true && <p className="text-xs text-destructive">{t("interrupted")}</p>}
      {turn.sources.length > 0 && <SourceList sources={turn.sources} onNavigate={onNavigate} heading={t("sources")} />}
      {!streaming && <p className="text-xs text-muted-foreground">{t("disclosure")}</p>}
    </div>
  );
}

function Citation({ n, source, onNavigate }: { n: number; source: AskSource | undefined; onNavigate: () => void }) {
  const t = useTranslations("Ask");
  const label = `[${String(n)}]`;
  if (source === undefined) return <sup className="ml-0.5 text-xs text-muted-foreground">{label}</sup>;
  return (
    <sup className="ml-0.5">
      <NextLink
        href={source.url}
        onClick={onNavigate}
        aria-label={`${t("citation", { n })}: ${source.title}`}
        className="rounded px-0.5 text-xs font-medium underline underline-offset-2 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {label}
      </NextLink>
    </sup>
  );
}

function SourceList({ sources, heading, onNavigate }: { sources: AskSource[]; heading: string; onNavigate: () => void }) {
  const t = useTranslations("Ask");
  if (sources.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{heading}</h3>
      <ul className="flex flex-col gap-2">
        {sources.map((source) => (
          <li key={source.url}>
            <NextLink
              href={source.url}
              onClick={onNavigate}
              className="flex min-h-11 gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
            >
              <span
                aria-hidden={source.n === null}
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums"
              >
                {source.n ?? "·"}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {source.n === null && <span className="sr-only">{t("related")}: </span>}
                  {source.title}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">{source.url}</span>
                {source.excerpt !== undefined && <span className="text-sm text-muted-foreground">{source.excerpt}</span>}
              </span>
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
