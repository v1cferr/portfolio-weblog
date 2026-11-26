"use client";

import { Button } from "@workspace/ui/components/button";
import { ArrowUpIcon, SquareIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";

import { usePathname } from "@/i18n/navigation";
import { MAX_QUESTION } from "@/lib/ask/protocol";

import { Answer } from "./answer";
import { useAsk } from "./ask-provider";

/** The character counter shows only near the limit. */
const COUNTER_FROM = MAX_QUESTION - 50;

/**
 * The dock's body (loaded on the first open, see ask-dock.tsx): the
 * conversation or, before the first question, suggestions that follow the
 * page being read, and the question box.
 */
export default function AskConversation({ onNavigate, onSearch }: { onNavigate: () => void; onSearch: (question: string) => void }) {
  const t = useTranslations("Ask");
  const { turns, busy, ask, stop } = useAsk();
  const [question, setQuestion] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef<HTMLLIElement>(null);
  const suggestions = usePageSuggestions();
  const nearLimit = question.length >= COUNTER_FROM;

  // Loaded after an open: the dock held focus on itself meanwhile (ask-dock.tsx), so hand it to the question box.
  useEffect(() => {
    if (document.activeElement?.id === "ask-dock") input.current?.focus();
  }, []);

  // A new question scrolls to its own top, so it is read from the start rather than from the last source card.
  useEffect(() => {
    if (turns.length === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    latest.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [turns.length]);

  function submit(text: string) {
    if (busy || text.trim().length < 2) return;
    ask(text);
    setQuestion("");
    input.current?.focus();
  }

  function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(question);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
        {turns.length === 0 ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("suggestionsTitle")}</h3>
            <ul className="flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => {
                      submit(suggestion);
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
          <ol className="flex flex-col gap-6" aria-label={t("conversation")}>
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
      <form onSubmit={onSubmit} className="flex flex-col gap-1 border-t border-border/60 p-2 sm:p-3">
        <div className="flex items-center gap-2">
          <label htmlFor="ask-question" className="sr-only">
            {t("title")}
          </label>
          <input
            ref={input}
            id="ask-question"
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            maxLength={MAX_QUESTION}
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
            placeholder={t("placeholder")}
            aria-describedby={nearLimit ? "ask-counter" : undefined}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-input/30 px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
          />
          {busy ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                stop();
                input.current?.focus();
              }}
              className="h-11 gap-1.5 px-3"
            >
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
        {nearLimit && (
          <p id="ask-counter" className="self-end px-1 text-xs text-muted-foreground tabular-nums" data-testid="ask-counter">
            {t("counter", { count: question.length, max: MAX_QUESTION })}
          </p>
        )}
      </form>
    </div>
  );
}

/**
 * The suggested questions, led by one about the page being read: a project's
 * problem on /projects/[id], the work done at an organization on /career/[id].
 * The name comes from the page's own heading, read after each navigation.
 */
function usePageSuggestions(): string[] {
  const t = useTranslations("Ask");
  const pathname = usePathname();
  const [heading, setHeading] = useState<{ path: string; text: string } | null>(null);
  const kind = /^\/projects\/[^/]+$/.test(pathname) ? "project" : /^\/career\/[^/]+$/.test(pathname) ? "career" : null;

  useEffect(() => {
    if (kind === null) return;
    // The new page can commit a frame after the path changes (view transitions), so look once more on the next frame.
    let frame = 0;
    const read = () => {
      const text = document.querySelector("main h1")?.textContent.trim() ?? "";
      if (text !== "") setHeading({ path: pathname, text });
      return text !== "";
    };
    if (!read()) frame = requestAnimationFrame(read);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pathname, kind]);

  const general = t.raw("suggestions") as string[];
  if (kind === null || heading?.path !== pathname) return general;
  const first =
    kind === "project" ? t("pageSuggestion.project", { title: heading.text }) : t("pageSuggestion.career", { org: heading.text });
  return [first, ...general.slice(0, 3)];
}
