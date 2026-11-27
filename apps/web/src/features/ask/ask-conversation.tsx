"use client";

import { Button } from "@workspace/ui/components/button";
import { type ChatContainerContext, ChatContainerContent, ChatContainerRoot } from "@workspace/ui/components/chat-container";
import { PromptInput, PromptInputActions, PromptInputTextarea } from "@workspace/ui/components/prompt-input";
import { ArrowUpIcon, SquareIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { usePathname } from "@/i18n/navigation";
import { MAX_QUESTION } from "@/lib/ask/protocol";

import { Answer } from "./answer";
import { useAsk } from "./ask-provider";

/** The character counter shows only near the limit. */
const COUNTER_FROM = MAX_QUESTION - 50;
/** Room kept above the latest question when the list follows an answer down. */
const QUESTION_MARGIN = 12;

/**
 * The dock's body (loaded on the first open, see ask-dock.tsx): the
 * conversation or, before the first question, suggestions that follow the
 * page being read, and the question box.
 *
 * Only the message list scrolls (prompt-kit's ChatContainer). It follows an
 * answer as it grows, but never past the top of the latest question, so a long
 * answer is read from its start; scrolling up lets go. Nothing here calls
 * scrollIntoView, which would also scroll the dock and the page around it.
 */
export default function AskConversation({ onNavigate, onSearch }: { onNavigate: () => void; onSearch: (question: string) => void }) {
  const t = useTranslations("Ask");
  const { turns, busy, ask, stop } = useAsk();
  const [question, setQuestion] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const latest = useRef<HTMLLIElement>(null);
  const list = useRef<ChatContainerContext>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const suggestions = usePageSuggestions();
  const nearLimit = question.length >= COUNTER_FROM;

  // Loaded after an open: the dock held focus on itself meanwhile (ask-dock.tsx), so hand it to the question box.
  useEffect(() => {
    if (document.activeElement?.id === "ask-dock") input.current?.focus({ preventScroll: true });
  }, []);

  // A new question brings the list down to it, even when the reader had scrolled up.
  useEffect(() => {
    if (turns.length === 0) return;
    void list.current?.scrollToBottom(reduceMotion ? "instant" : "smooth");
  }, [turns.length, reduceMotion]);

  // The bottom, but no further than the latest question's top: its start stays in view however long the answer grows.
  const targetScrollTop = useCallback((target: number) => {
    const question = latest.current;
    return question === null ? target : Math.min(target, Math.max(0, question.offsetTop - QUESTION_MARGIN));
  }, []);

  function submit(text: string) {
    if (busy || text.trim().length < 2) return;
    ask(text);
    setQuestion("");
    input.current?.focus({ preventScroll: true });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatContainerRoot
        className="flex-1"
        contextRef={list}
        targetScrollTop={targetScrollTop}
        resize={reduceMotion ? "instant" : "smooth"}
        data-testid="ask-messages"
      >
        <ChatContainerContent className="px-3 py-3 sm:px-4">
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
                <li key={turn.id} ref={index === turns.length - 1 ? latest : undefined} className="flex flex-col gap-3">
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
        </ChatContainerContent>
      </ChatContainerRoot>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(question);
        }}
        className="flex shrink-0 flex-col gap-1 border-t border-border/60 p-2 sm:p-3"
      >
        <label htmlFor="ask-question" className="sr-only">
          {t("title")}
        </label>
        <PromptInput
          value={question}
          onValueChange={setQuestion}
          onSubmit={() => {
            submit(question);
          }}
          isLoading={busy}
          maxHeight={120}
          className="flex items-end gap-1.5"
        >
          <PromptInputTextarea
            ref={input}
            id="ask-question"
            enterKeyHint="send"
            autoComplete="off"
            maxLength={MAX_QUESTION}
            placeholder={t("placeholder")}
            aria-describedby={nearLimit ? "ask-counter" : undefined}
            // A long placeholder stays on one line instead of spilling under the box.
            className="text-base placeholder:truncate sm:text-sm"
          />
          <PromptInputActions className="shrink-0">
            {busy ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  stop();
                  input.current?.focus({ preventScroll: true });
                }}
                className="h-11 gap-1.5 px-3 max-sm:w-11 max-sm:px-0"
              >
                <SquareIcon aria-hidden className="fill-current" />
                {/* Icon only on phones, where the question box needs the width; the name stays for assistive technology. */}
                <span className="max-sm:sr-only">{t("stop")}</span>
              </Button>
            ) : (
              <Button type="submit" disabled={question.trim().length < 2} className="h-11 gap-1.5 px-3 max-sm:w-11 max-sm:px-0">
                <ArrowUpIcon aria-hidden />
                <span className="max-sm:sr-only">{t("submit")}</span>
              </Button>
            )}
          </PromptInputActions>
        </PromptInput>
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
