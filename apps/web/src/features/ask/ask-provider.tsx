"use client";

import { track } from "@vercel/analytics";
import { useLocale, useTranslations } from "next-intl";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { type AskMode, type AskTurn, MAX_HISTORY, MAX_QUESTION } from "@/lib/ask/protocol";

import { ASK_OPEN_EVENT, type AskOpenDetail } from "./open-ask";
import { answerText, isBusy, type Part, readEvents, restoreTurns, type Turn } from "./turn";

/** Where the dock was opened from, for analytics. */
export type AskOpenSource = "launcher" | "header" | "page";

interface AskContextValue {
  /** Hydrated, with the saved conversation read back. */
  ready: boolean;
  turns: Turn[];
  busy: boolean;
  open: boolean;
  expanded: boolean;
  /** An answer finished while the dock was minimized. */
  unread: boolean;
  /** The polite status line: searching, answer ready, nothing found. */
  announcement: string;
  /** Bumped each time the dock is opened on purpose, so the panel focuses its input. */
  focusRequest: number;
  ask: (question: string) => void;
  stop: () => void;
  clear: () => void;
  openDock: (from: AskOpenSource) => void;
  minimize: () => void;
  setExpanded: (expanded: boolean) => void;
}

const AskContext = createContext<AskContextValue | null>(null);

export function useAsk() {
  const value = useContext(AskContext);
  if (value === null) throw new Error("useAsk needs an <AskProvider>");
  return value;
}

const turnsKey = (locale: string) => `v1c:ask:turns:${locale}`;
const UI_KEY = "v1c:ask:ui";

function readStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function readUi(): { open: boolean; expanded: boolean } {
  try {
    const ui = JSON.parse(readStorage(UI_KEY) ?? "{}") as { open?: unknown; expanded?: unknown };
    return { open: ui.open === true, expanded: ui.expanded === true };
  } catch {
    return { open: false, expanded: false };
  }
}

const subscribeNothing = () => () => undefined;
const onClient = () => true;
const onServer = () => false;

function writeStorage(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Private mode, a full quota or blocked storage: the conversation just does not outlive the page.
  }
}

/**
 * The profile chat's state (ADR 0011), mounted once in the locale layout so it
 * outlives navigations: the conversation, the streaming request, and whether
 * the dock is open, minimized or expanded. The conversation is kept in
 * sessionStorage per locale, so it also survives a reload of the tab.
 * Minimizing never stops an answer; only leaving the site does.
 */
export function AskProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("Ask");
  const locale = useLocale();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpandedState] = useState(false);
  const [unread, setUnread] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [focusRequest, setFocusRequest] = useState(0);
  const [restored, setRestored] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const openRef = useRef(false);
  const hydrated = useSyncExternalStore(subscribeNothing, onClient, onServer);

  // Read back once hydrated (the server has no storage, and the first render must match its HTML), once per locale.
  // A click on the launcher can land between hydration and this read: on the first read, what the visitor already
  // did wins over what was saved.
  if (hydrated && restored !== locale) {
    const first = restored === null;
    const saved = restoreTurns(readStorage(turnsKey(locale)));
    const ui = readUi();
    setRestored(locale);
    setTurns((current) => (first && current.length > 0 ? current : saved));
    setOpen((current) => (first ? current || ui.open : ui.open));
    setExpandedState((current) => (first ? current || ui.expanded : ui.expanded));
  }

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (restored !== locale) return;
    writeStorage(turnsKey(locale), JSON.stringify(turns));
  }, [turns, locale, restored]);

  useEffect(() => {
    if (restored === null) return;
    writeStorage(UI_KEY, JSON.stringify({ open, expanded }));
  }, [open, expanded, restored]);

  // Stop an answer still streaming only when the provider itself goes away (the tab closes).
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    []
  );

  // A language switch swaps in the other locale's conversation: an answer still streaming belongs to the one being
  // left, so it stops here (it is saved as stopped) instead of writing into the other.
  const localeRef = useRef(locale);
  useEffect(() => {
    if (localeRef.current === locale) return;
    localeRef.current = locale;
    controller.current?.abort();
    controller.current = null;
  }, [locale]);

  /** Changes one turn of `owner`'s conversation; a no-op once the conversation shown is another locale's. */
  const update = useCallback((owner: string, id: number, change: (turn: Turn) => Turn) => {
    if (localeRef.current !== owner) return;
    setTurns((list) => list.map((turn) => (turn.id === id ? change(turn) : turn)));
  }, []);

  const ask = useCallback(
    (text: string) => {
      const asked = text.trim().slice(0, MAX_QUESTION);
      if (asked.length < 2 || turnsRef.current.some(isBusy)) return;
      const id = turnsRef.current.reduce((max, turn) => Math.max(max, turn.id + 1), 0);
      const history: AskTurn[] = turnsRef.current
        .filter((turn) => turn.mode === "model" && turn.phase === "done")
        .slice(-MAX_HISTORY)
        .map((turn) => ({ question: turn.question, answer: answerText(turn) }));
      const startedAt = Date.now();
      const pending: Turn = { id, question: asked, phase: "searching", parts: [], sources: [], startedAt };
      turnsRef.current = [...turnsRef.current, pending];
      setTurns((list) => [...list, pending]);
      setAnnouncement(t("status.searching"));
      track("ask_question");

      const abort = new AbortController();
      controller.current = abort;
      void (async () => {
        let mode: AskMode | undefined;
        try {
          const response = await fetch("/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale, question: asked, history }),
            signal: abort.signal,
          });
          if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
          let finished = false;
          for await (const event of readEvents(response)) {
            switch (event.type) {
              case "status":
                mode = event.mode;
                update(locale, id, (turn) => ({
                  ...turn,
                  phase: "streaming",
                  elapsedMs: Date.now() - startedAt,
                  mode: event.mode,
                  ...(event.reason && { reason: event.reason }),
                  ...(event.partial && { partial: true }),
                }));
                if (event.mode === "no-source" || event.mode === "unknown") setAnnouncement(t("status.noSource"));
                break;
              case "reading":
                update(locale, id, (turn) => ({ ...turn, reading: event.pages }));
                break;
              case "checking":
                update(locale, id, (turn) => ({ ...turn, checked: true }));
                break;
              case "text":
                update(locale, id, (turn) => {
                  const last = turn.parts.at(-1);
                  const parts: Part[] =
                    last?.type === "text"
                      ? [...turn.parts.slice(0, -1), { type: "text", text: last.text + event.text }]
                      : [...turn.parts, event];
                  return { ...turn, parts };
                });
                break;
              case "cite":
                update(locale, id, (turn) => ({ ...turn, parts: [...turn.parts, event] }));
                break;
              case "sources":
                update(locale, id, (turn) => ({ ...turn, sources: event.sources }));
                break;
              case "error":
                update(locale, id, (turn) => ({ ...turn, interrupted: true }));
                break;
              case "done":
                finished = true;
                break;
            }
          }
          update(locale, id, (turn) => ({ ...turn, phase: "done", interrupted: turn.interrupted === true || !finished }));
          if (mode !== "no-source" && mode !== "unknown") setAnnouncement(t("status.ready"));
          if (!openRef.current) setUnread(true);
        } catch {
          // Stopped by a language switch: the conversation shown now is another locale's, so say nothing.
          if (localeRef.current !== locale) return;
          if (abort.signal.aborted) {
            update(locale, id, (turn) => ({ ...turn, phase: "stopped" }));
            setAnnouncement(t("status.stopped"));
          } else {
            update(locale, id, (turn) => ({ ...turn, phase: "failed" }));
            setAnnouncement(t("status.error"));
            if (!openRef.current) setUnread(true);
          }
        } finally {
          if (controller.current === abort) controller.current = null;
        }
      })();
    },
    [locale, t, update]
  );

  const stop = useCallback(() => {
    controller.current?.abort();
  }, []);

  const clear = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    turnsRef.current = [];
    setTurns([]);
    setAnnouncement("");
    setFocusRequest((n) => n + 1);
  }, []);

  const openDock = useCallback((from: AskOpenSource) => {
    if (!openRef.current) track("ask_open", { from });
    openRef.current = true;
    setOpen(true);
    setUnread(false);
    setFocusRequest((n) => n + 1);
  }, []);

  const minimize = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  // openAsk() from anywhere on the page (open-ask.ts): open, focus the input and, given a question, send it.
  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<(AskOpenDetail & { from?: AskOpenSource }) | null>).detail ?? {};
      openDock(detail.from ?? "page");
      if (detail.question !== undefined) ask(detail.question);
    }
    window.addEventListener(ASK_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(ASK_OPEN_EVENT, onOpen);
    };
  }, [ask, openDock]);

  const value = useMemo<AskContextValue>(
    () => ({
      ready: restored !== null,
      turns,
      busy: turns.some(isBusy),
      open,
      expanded,
      unread,
      announcement,
      focusRequest,
      ask,
      stop,
      clear,
      openDock,
      minimize,
      setExpanded: setExpandedState,
    }),
    [restored, turns, open, expanded, unread, announcement, focusRequest, ask, stop, clear, openDock, minimize]
  );

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}
