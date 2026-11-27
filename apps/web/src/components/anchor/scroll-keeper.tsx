"use client";

import { usePathname as useFullPathname } from "next/navigation";
import { useLayoutEffect } from "react";

import { usePathname } from "@/i18n/navigation";
import { normalizePath, parsePlace, pickAnchor, type ReadingPlace, scrollRatio, uiStateKey } from "@/lib/ui-state";

/*
 * A language switch keeps the reader's place (docs/guides/ui-state.md). The
 * switch is a navigation to another [locale] segment, which remounts the whole
 * page: the browser and Next.js would put the reader back at the top. The
 * locale switcher saves where the reader is just before it navigates; the
 * ScrollKeeper in the layout reads it back once, after the new page mounted.
 */

/** One place at a time, read once and deleted. */
const PLACE_KEY = uiStateKey("locale-switch:place");

/** Marks the locale switcher's trigger, which gets the focus back after the switch. */
export const LOCALE_SWITCHER_ATTRIBUTE = "data-locale-switcher";

/** Elements worth naming a place by: shareable ones first of all, then sections and headings with an id. */
const CANDIDATES = "[data-anchor][id], main :is(section, h1, h2, h3, h4)[id]";

/** How long the restore keeps correcting for late layout shifts (fonts, images, disclosures), unless the reader moves first. */
const SETTLE_MS = 1500;

/** What the reader does to take over: the restore stops correcting at once. */
const READER_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

let quietHash = false;

/** True once after a restore: HashTarget skips highlighting the fragment the reader was already at. */
export function takeQuietHash(): boolean {
  const quiet = quietHash;
  quietHash = false;
  return quiet;
}

/** The header's line: fragments and focus stop below it (scroll-padding-top in globals.css). */
function headerLine(): number {
  return Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
}

/** An element's top in the document. */
function documentTop(element: HTMLElement): number {
  return element.getBoundingClientRect().top + window.scrollY;
}

/** Saves where the reader is on `path` (the locale-less pathname), for the page about to replace this one. */
export function savePlace(path: string): void {
  const line = headerLine();
  const candidates = [...document.querySelectorAll<HTMLElement>(CANDIDATES)]
    // Hidden elements (a folded <details>, display: none) have no box to measure.
    .filter((element) => element.getClientRects().length > 0)
    .map((element) => ({ id: element.id, top: documentTop(element) - window.scrollY }));
  const anchor = pickAnchor(candidates, line);
  const root = document.documentElement;
  const place: ReadingPlace = {
    path: normalizePath(path),
    ...(anchor !== undefined && { anchorId: anchor.id }),
    offset: anchor?.top ?? 0,
    ratio: scrollRatio(window.scrollY, root.scrollHeight, window.innerHeight),
  };
  try {
    window.sessionStorage.setItem(PLACE_KEY, JSON.stringify(place));
  } catch {
    // Without storage the switch just starts at the top, as it always did.
  }
}

function takePlace(): ReadingPlace | undefined {
  try {
    const raw = window.sessionStorage.getItem(PLACE_KEY);
    window.sessionStorage.removeItem(PLACE_KEY);
    return parsePlace(raw);
  } catch {
    return undefined;
  }
}

/** Puts the reader back: the same element at the same height, or the same share of the page when it is gone. */
function restore(place: ReadingPlace) {
  const element = place.anchorId === undefined ? null : document.getElementById(place.anchorId);
  const top =
    element !== null && element.getClientRects().length > 0
      ? documentTop(element) - place.offset
      : place.ratio * (document.documentElement.scrollHeight - window.innerHeight);
  // Always instant: this is a correction, not a movement the reader should see (and reduced motion stays still).
  if (Math.abs(window.scrollY - Math.max(0, top)) >= 1) window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
}

/** The restore in progress, if any: one at a time, outliving the effect that started it. */
let stopRestore: (() => void) | undefined;

/**
 * Keeps the reader at `place` on every frame for a moment: the new page can
 * still be committing, a restored disclosure (useSessionState) or a late font
 * or image can move the element. It stops as soon as the reader scrolls,
 * types or touches, or after SETTLE_MS.
 */
function startRestore(place: ReadingPlace) {
  stopRestore?.();
  const started = performance.now();
  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    for (const event of READER_EVENTS) window.removeEventListener(event, stop);
    if (stopRestore === stop) stopRestore = undefined;
  };
  const tick = () => {
    restore(place);
    frame = performance.now() - started < SETTLE_MS ? requestAnimationFrame(tick) : 0;
    if (frame === 0) stop();
  };
  stopRestore = stop;
  for (const event of READER_EVENTS) window.addEventListener(event, stop, { passive: true });
  tick();
}

/**
 * Restores the place saved by the locale switcher, on the page it was saved
 * for, and gives the focus back to the switcher, where it was.
 */
export function ScrollKeeper() {
  const fullPathname = useFullPathname();
  const pathname = usePathname();

  useLayoutEffect(() => {
    const place = takePlace();
    if (place === undefined || place.path !== normalizePath(pathname)) return;
    quietHash = true;
    startRestore(place);
    const frame = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[${LOCALE_SWITCHER_ATTRIBUTE}]`)?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
    // The full pathname changes with the locale, the locale-less one does not; a switch must run this again.
  }, [fullPathname, pathname]);

  return null;
}
