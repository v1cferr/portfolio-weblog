"use client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Maximize2Icon, Minimize2Icon, MinusIcon, SparklesIcon, SquarePenIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { InfoTip } from "@/components/info-tip";
import { openSearch } from "@/features/search/open-search";

import { useAsk } from "./ask-provider";

// The conversation, the answers and their links are only downloaded on the first open; every page ships the launcher.
const loadConversation = () => import("./ask-conversation");
const AskConversation = dynamic(loadConversation, { ssr: false });

function preload() {
  void loadConversation();
}

/** Matches Tailwind's `sm`: below it the dock is a full-screen sheet over the page. */
const PHONE = "(max-width: 39.999rem)";

/**
 * The profile chat, docked in the bottom-right corner (ADR 0011): a launcher
 * and a non-modal panel, so the site can be browsed while the conversation
 * stays open. Not a modal dialog on purpose: no backdrop, no focus trap, the
 * page stays clickable. Esc minimizes; the expand button turns the panel into
 * a drawer down the right side, under the header, that the page makes room
 * for from `lg` up. On phones it is a
 * full-screen sheet.
 */
export function AskDock() {
  const t = useTranslations("Ask");
  const { ready, open, expanded, unread, announcement, turns, focusRequest, openDock, minimize, setExpanded, clear } = useAsk();
  const [loaded, setLoaded] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  if (open && !loaded) setLoaded(true);

  // The page reacts to the dock: room on the right for the drawer (lg up), and scroll padding at the bottom so focused
  // content does not end up under the floating panel (WCAG 2.4.11). Both are CSS on these attributes (globals.css).
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.setAttribute("data-ask-dock", expanded ? "drawer" : "panel");
    else root.removeAttribute("data-ask-dock");
    return () => {
      root.removeAttribute("data-ask-dock");
    };
  }, [open, expanded]);

  // Opening the dock on purpose (the launcher, the header button, openAsk) puts the caret in the question box; before
  // the conversation has loaded, the panel itself holds focus, so Esc and Tab already work from inside it.
  useEffect(() => {
    if (focusRequest === 0) return;
    const input = panel.current?.querySelector<HTMLElement>("#ask-question");
    (input ?? panel.current)?.focus();
  }, [focusRequest]);

  function minimizeAndReturn() {
    // Committed first: on phones the launcher is hidden under the open sheet and cannot take focus until it is shown.
    flushSync(minimize);
    launcher.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    minimizeAndReturn();
  }

  // On a phone the sheet covers the page, so following a link steps it aside; on larger screens it stays open.
  function onNavigate() {
    if (window.matchMedia(PHONE).matches) minimize();
  }

  return (
    <>
      {/* State changes only (searching, answer ready, nothing found); the answer text itself is not read out as it streams. */}
      <p role="status" aria-live="polite" className="sr-only" data-testid="ask-status">
        {announcement}
      </p>
      <button
        ref={launcher}
        type="button"
        onClick={() => {
          if (open) minimize();
          else openDock("launcher");
        }}
        // Start downloading the conversation as soon as an open looks likely.
        onPointerEnter={preload}
        onFocus={preload}
        aria-label={t("openLabel")}
        aria-expanded={open}
        aria-controls="ask-dock"
        data-testid="ask-launcher"
        // Set once the dock listens for openAsk() and has its saved conversation back.
        data-ready={ready ? "" : undefined}
        className={cn(
          "glass-float fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex h-14 items-center justify-center gap-2 rounded-full px-5 max-sm:w-14 max-sm:px-0 text-sm font-medium text-foreground transition-[translate,opacity,background-color] hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none",
          // The open sheet covers the launcher on phones, and the drawer has its own minimize button.
          open && "max-sm:invisible max-sm:opacity-0",
          open && expanded && "invisible opacity-0"
        )}
      >
        <SparklesIcon aria-hidden className="size-4 text-primary" />
        {/* A 56px circle on phones, where it floats over the text; the word from sm up. */}
        <span className="max-sm:sr-only">{t("open")}</span>
        {unread && (
          <span className="absolute top-2 right-2 size-2.5 rounded-full bg-primary ring-2 ring-background" data-testid="ask-unread">
            <span className="sr-only">{t("unread")}</span>
          </span>
        )}
      </button>
      <div
        ref={panel}
        id="ask-dock"
        role="dialog"
        aria-labelledby="ask-dock-title"
        tabIndex={-1}
        data-state={open ? "open" : "closed"}
        data-expanded={expanded ? "" : undefined}
        onKeyDown={onKeyDown}
        className={cn(
          "glass-float fixed z-40 flex flex-col overflow-hidden text-sm text-foreground outline-none",
          // Visibility flips at once on opening (so the panel can take focus right away) and only after the fade on closing.
          "duration-200 ease-out motion-reduce:translate-y-0",
          open
            ? "visible translate-y-0 opacity-100 transition-[opacity,translate] motion-reduce:transition-opacity"
            : "invisible translate-y-4 opacity-0 transition-[opacity,translate,visibility] motion-reduce:transition-[opacity,visibility]",
          // Phones: a full-screen sheet.
          "max-sm:inset-0 max-sm:h-dvh max-sm:w-full max-sm:rounded-none max-sm:pb-[env(safe-area-inset-bottom)]",
          expanded
            ? // The drawer: the full height under the header, on the right; lg pads the page so nothing hides under it.
              "sm:top-[4.5rem] sm:right-0 sm:bottom-0 sm:w-[440px] sm:rounded-none sm:rounded-tl-2xl"
            : // The panel: anchored bottom-right, above the launcher.
              "sm:right-[max(1rem,env(safe-area-inset-right))] sm:bottom-[calc(max(1rem,env(safe-area-inset-bottom))_+_4.5rem)] sm:h-[min(640px,100dvh_-_6.5rem)] sm:w-[400px] sm:rounded-2xl"
        )}
      >
        <div className="flex items-center gap-1 border-b border-border/60 py-1.5 pr-1.5 pl-4">
          <SparklesIcon aria-hidden className="size-4 shrink-0 text-primary" />
          <h2 id="ask-dock-title" className="ml-1 min-w-0 truncate text-sm font-medium">
            {t("title")}
          </h2>
          {/* Where answers come from and the privacy note: one gesture away, not in the way. */}
          <InfoTip label={t("aboutLabel")} align="start" className="max-sm:size-11">
            <span className="flex flex-col gap-2" data-testid="ask-about">
              <span>{t("description")}</span>
              <span>{t("privacy")}</span>
            </span>
          </InfoTip>
          <span className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 sm:size-9"
            onClick={clear}
            disabled={turns.length === 0}
            aria-label={t("clear")}
            title={t("clear")}
          >
            <SquarePenIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 max-sm:hidden"
            onClick={() => {
              setExpanded(!expanded);
            }}
            aria-label={expanded ? t("collapse") : t("expand")}
            aria-pressed={expanded}
            title={expanded ? t("collapse") : t("expand")}
            data-testid="ask-expand"
          >
            {expanded ? <Minimize2Icon /> : <Maximize2Icon />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 sm:size-9"
            onClick={minimizeAndReturn}
            aria-label={t("minimize")}
            title={t("minimize")}
          >
            <MinusIcon />
          </Button>
        </div>
        {loaded && (
          <AskConversation
            onNavigate={onNavigate}
            onSearch={(question) => {
              openSearch(question);
            }}
          />
        )}
      </div>
    </>
  );
}
