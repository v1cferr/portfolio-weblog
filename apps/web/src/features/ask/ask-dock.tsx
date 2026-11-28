"use client";

import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { Maximize2Icon, Minimize2Icon, MinusIcon, SparklesIcon, SquarePenIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { InfoTip } from "@/components/info-tip";
import { openSearch } from "@/features/search/open-search";
import { useDelayed } from "@/hooks/use-delayed";
import { useMediaQuery } from "@/hooks/use-media-query";

import { useAsk } from "./ask-provider";
import { useKeyboardInset } from "./use-keyboard-inset";

/** Matches Tailwind's `sm`: below it the dock is a bottom sheet over the page. */
const PHONE = "(max-width: 39.999rem)";

// The conversation, the answers and their links are only downloaded on the first open; every page ships the launcher.
const loadConversation = () => import("./ask-conversation");
const AskConversation = dynamic(loadConversation, { ssr: false, loading: () => <ConversationSkeleton /> });

// The phone sheet brings vaul, which desktops never need. Phones fetch it once the page is idle; until it arrives
// (a tap on a slow network), a plain sheet in the same place holds the same header and conversation.
const loadSheet = () => import("./ask-sheet");
const AskSheet = dynamic(loadSheet, { ssr: false });

function preload() {
  void loadConversation();
  if (window.matchMedia(PHONE).matches) void loadSheet();
}

/**
 * The profile chat, docked in the bottom-right corner (ADR 0011): a launcher
 * and a panel, so the site can be browsed while the conversation stays open.
 * - From `sm` up, a non-modal panel: no backdrop, no focus trap, the page
 *   stays clickable. Esc minimizes; the expand button turns it into a drawer
 *   down the right side, under the header, that the page makes room for from
 *   `lg` up.
 * - On phones, a modal bottom sheet (vaul): it covers the page anyway, so it
 *   locks the page's scroll and keeps focus inside, and it closes with a drag
 *   down, Esc or its minimize button. It sits under the notch and above the
 *   on-screen keyboard.
 * Both hold the same header and conversation. Only the message list scrolls:
 * the panel itself clips (`overflow-clip`), so nothing inside can scroll it
 * and push the header away.
 */
export function AskDock() {
  const t = useTranslations("Ask");
  const { ready, open, expanded, unread, announcement, focusRequest, openDock, minimize } = useAsk();
  const [loaded, setLoaded] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);
  const phone = useMediaQuery(PHONE);
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  if (open && !loaded) setLoaded(true);
  useKeyboardInset(phone && open);

  useEffect(() => {
    if (!phone || sheetReady) return;
    let cancelled = false;
    const load = () => {
      void loadSheet().then(() => {
        if (!cancelled) setSheetReady(true);
      });
    };
    // Right away once the dock is open; otherwise when the page has nothing better to do.
    if (open) load();
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(load, { timeout: 4000 }) : undefined;
    const fallback = idle === undefined ? setTimeout(load, 2000) : undefined;
    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(fallback);
    };
  }, [phone, open, sheetReady]);

  // The page reacts to the dock: room on the right for the drawer (lg up), and scroll padding at the bottom so focused
  // content does not end up under the floating panel (WCAG 2.4.11). Both are CSS on these attributes (globals.css).
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.setAttribute("data-ask-dock", phone ? "sheet" : expanded ? "drawer" : "panel");
    else root.removeAttribute("data-ask-dock");
    return () => {
      root.removeAttribute("data-ask-dock");
    };
  }, [open, expanded, phone]);

  // Opening the dock on purpose (the launcher, the header button, openAsk) puts the caret in the question box; before
  // the conversation has loaded, the panel itself holds focus, so Esc and Tab already work from inside it. Never
  // scrolls: a focus that scrolls would move the page under a phone's sheet.
  function focusInput() {
    const input = panel.current?.querySelector<HTMLElement>("#ask-question");
    (input ?? panel.current)?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (focusRequest === 0) return;
    focusInput();
  }, [focusRequest]);

  function minimizeAndReturn() {
    // Committed first: on phones the launcher is hidden under the open sheet and cannot take focus until it is shown.
    flushSync(minimize);
    launcher.current?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    minimizeAndReturn();
  }

  // On a phone the sheet covers the page, so following a link steps it aside; on larger screens it stays open.
  function onNavigate() {
    if (phone) minimize();
  }

  const conversation = loaded && (
    <AskConversation
      onNavigate={onNavigate}
      onSearch={(question) => {
        openSearch(question);
      }}
    />
  );

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
      {phone ? (
        sheetReady ? (
          <AskSheet
            open={open}
            title={t("title")}
            panel={panel}
            launcher={launcher}
            onClose={minimize}
            focusInput={focusInput}
            header={(title) => <DockHeader title={title} onMinimize={minimizeAndReturn} />}
          >
            {conversation}
          </AskSheet>
        ) : (
          open && (
            <div
              ref={panel}
              id="ask-dock"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ask-dock-title"
              tabIndex={-1}
              onKeyDown={onKeyDown}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(100dvh_-_max(env(safe-area-inset-top),0.75rem))] flex-col overflow-clip rounded-t-2xl bg-background text-sm text-foreground shadow-2xl outline-none"
            >
              <DockHeader
                title={
                  <h2 id="ask-dock-title" className="ml-1 min-w-0 truncate text-sm font-medium">
                    {t("title")}
                  </h2>
                }
                onMinimize={minimizeAndReturn}
              />
              {conversation}
            </div>
          )
        )
      ) : (
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
            // Clipped, not hidden: an overflow-hidden box can still be scrolled (by focus, find-in-page or a script), which
            // would push the header out of view.
            "glass-float fixed z-40 flex flex-col overflow-clip text-sm text-foreground outline-none",
            // Visibility flips at once on opening (so the panel can take focus right away) and only after the fade on closing.
            "duration-200 ease-out motion-reduce:translate-y-0",
            open
              ? "visible translate-y-0 opacity-100 transition-[opacity,translate] motion-reduce:transition-opacity"
              : "invisible translate-y-4 opacity-0 transition-[opacity,translate,visibility] motion-reduce:transition-[opacity,visibility]",
            // Before hydration knows the width, a phone gets the full screen rather than a corner panel.
            "max-sm:inset-0 max-sm:h-dvh max-sm:w-full max-sm:rounded-none",
            expanded
              ? // The drawer: the full height under the header, on the right; lg pads the page so nothing hides under it.
                "sm:top-[4.5rem] sm:right-0 sm:bottom-0 sm:w-[440px] sm:rounded-none sm:rounded-tl-2xl"
              : // The panel: anchored bottom-right, above the launcher.
                "sm:right-[max(1rem,env(safe-area-inset-right))] sm:bottom-[calc(max(1rem,env(safe-area-inset-bottom))_+_4.5rem)] sm:h-[min(640px,100dvh_-_6.5rem)] sm:w-[400px] sm:rounded-2xl"
          )}
        >
          <DockHeader
            title={
              <h2 id="ask-dock-title" className="ml-1 min-w-0 truncate text-sm font-medium">
                {t("title")}
              </h2>
            }
            onMinimize={minimizeAndReturn}
            canExpand
          />
          {conversation}
        </div>
      )}
    </>
  );
}

/**
 * The dock's title bar, the same on the panel, the drawer and the phone
 * sheet: title, the note on where answers come from, a new conversation,
 * expand (not on phones) and minimize. Every button is 44px.
 */
function DockHeader({ title, onMinimize, canExpand = false }: { title: ReactNode; onMinimize: () => void; canExpand?: boolean }) {
  const t = useTranslations("Ask");
  const { turns, expanded, setExpanded, clear } = useAsk();
  return (
    <div className="flex shrink-0 items-center gap-0.5 border-b border-border/60 py-1 pr-1 pl-4">
      <SparklesIcon aria-hidden className="size-4 shrink-0 text-primary" />
      {title}
      {/* Where answers come from and the privacy note: one gesture away, not in the way. */}
      <InfoTip label={t("aboutLabel")} align="start" className="size-11">
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
        className="size-11"
        onClick={clear}
        disabled={turns.length === 0}
        aria-label={t("clear")}
        title={t("clear")}
      >
        <SquarePenIcon />
      </Button>
      {canExpand && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 max-sm:hidden"
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
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11"
        onClick={onMinimize}
        aria-label={t("minimize")}
        title={t("minimize")}
      >
        <MinusIcon />
      </Button>
    </div>
  );
}

/**
 * The dock's body while its code downloads, in the shape of what comes: the
 * suggestions heading, three suggestions and the question box. Only after
 * 300 ms, so a fast load (or a cached one) shows nothing.
 */
function ConversationSkeleton() {
  const shown = useDelayed(true);
  return (
    <div aria-busy="true" className="flex min-h-0 flex-1 flex-col" data-testid="ask-skeleton">
      {shown && (
        <>
          <div aria-hidden className="flex flex-1 flex-col gap-3 px-3 py-3 sm:px-4">
            <Skeleton className="h-3 w-28 motion-reduce:animate-none" />
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-11 w-full rounded-lg motion-reduce:animate-none" />
            ))}
          </div>
          <div aria-hidden className="flex items-center gap-2 border-t border-border/60 p-2 sm:p-3">
            <Skeleton className="h-11 flex-1 rounded-lg motion-reduce:animate-none" />
            <Skeleton className="h-11 w-24 rounded-lg motion-reduce:animate-none" />
          </div>
        </>
      )}
    </div>
  );
}
