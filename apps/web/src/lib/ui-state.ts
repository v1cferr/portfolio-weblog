/*
 * Per-tab UI state (docs/guides/ui-state.md): what is open, folded or scrolled
 * lives in sessionStorage, so it survives a reload and a language switch in the
 * same tab and never reaches the next visit. These helpers are pure, so the
 * key scheme and the parsing are unit-tested without a browser.
 */

/** Every key this site writes for UI state starts with this. */
export const UI_STATE_PREFIX = "v1c:ui:";

/** A site-wide key (`uiStateKey("explorer:open")` → `v1c:ui:explorer:open`). */
export function uiStateKey(scope: string): string {
  return `${UI_STATE_PREFIX}${scope}`;
}

/**
 * The scope of one page's element. The pathname is the locale-less one
 * (next-intl's usePathname), so the same element in every language shares it:
 * `uiStateKey(pageScope("/about", "read-all:x"))` → `v1c:ui:/about:read-all:x`.
 */
export function pageScope(pathname: string, id: string): string {
  return `${normalizePath(pathname)}:${id}`;
}

/** "/about/" and "/about" are one page; the home page is "/". */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** A stored JSON value, or the fallback when it is missing, corrupt or of another type. */
export function parseStored<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    const value = JSON.parse(raw) as unknown;
    if (value === null || typeof value !== typeof fallback) return fallback;
    if (Array.isArray(fallback) !== Array.isArray(value)) return fallback;
    return value as T;
  } catch {
    return fallback;
  }
}

/** Where the reader was on a page, kept across a language switch (components/anchor/scroll-keeper.tsx). */
export interface ReadingPlace {
  /** The locale-less pathname it was taken on. */
  path: string;
  /** The last anchored element whose top had passed the header line, if any. */
  anchorId?: string;
  /** That element's distance from the top of the viewport, in CSS pixels. */
  offset: number;
  /** How far down the page the reader was, from 0 to 1: the fallback when the anchor is gone. */
  ratio: number;
}

/** Reads a saved place back; anything malformed is no place at all. */
export function parsePlace(raw: string | null): ReadingPlace | undefined {
  const value = parseStored<Record<string, unknown>>(raw, {});
  const { path, anchorId, offset, ratio } = value;
  if (typeof path !== "string" || typeof offset !== "number" || typeof ratio !== "number") return undefined;
  if (!Number.isFinite(offset) || !Number.isFinite(ratio)) return undefined;
  return {
    path,
    ...(typeof anchorId === "string" && anchorId !== "" && { anchorId }),
    offset,
    ratio: Math.min(1, Math.max(0, ratio)),
  };
}

/** How far down a page of `scrollHeight` the reader is, given the viewport. */
export function scrollRatio(scrollY: number, scrollHeight: number, viewportHeight: number): number {
  const room = scrollHeight - viewportHeight;
  return room <= 0 ? 0 : Math.min(1, Math.max(0, scrollY / room));
}

/**
 * The element that names where the reader is: of candidates in document order,
 * the one whose top is closest above `line` (the header's scroll-padding), the
 * later (deeper) one on a tie. Nothing passed yet (the top of the page) gives
 * undefined.
 */
export function pickAnchor<T extends { top: number }>(candidates: readonly T[], line: number): T | undefined {
  let picked: T | undefined;
  for (const candidate of candidates) {
    if (candidate.top <= line + 1 && (picked === undefined || candidate.top >= picked.top)) picked = candidate;
  }
  return picked;
}
