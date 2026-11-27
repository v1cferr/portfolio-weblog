"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { usePathname } from "@/i18n/navigation";
import { pageScope, parseStored, uiStateKey } from "@/lib/ui-state";

/** Fired after a write in this tab; the `storage` event only reaches other tabs. */
const CHANGED = "v1c:ui-state";

/**
 * What this page load wrote, so the state still works where storage is blocked
 * (private windows, a full quota); it then lasts until the tab reloads.
 */
const written = new Map<string, string>();

function read(key: string): string | null {
  const own = written.get(key);
  if (own !== undefined) return own;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, raw: string) {
  written.set(key, raw);
  try {
    window.sessionStorage.setItem(key, raw);
  } catch {
    // Kept in memory above; it just does not outlive a reload.
  }
  window.dispatchEvent(new CustomEvent(CHANGED, { detail: key }));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
  };
}

const onServer = () => null;

/**
 * UI state kept for the browser tab (docs/guides/ui-state.md): `useState`
 * backed by sessionStorage under `v1c:ui:<scope>`, so it survives a reload and
 * a language switch, and a new tab starts from `initial`.
 *
 * The first render is always `initial`, the same HTML the server sent, so
 * hydration never mismatches; the saved value applies in the commit right
 * after (useSyncExternalStore re-renders synchronously when the client
 * snapshot differs from the server's), before the browser paints. Values are
 * JSON; one of another type than `initial` is ignored.
 */
export function useSessionState<T>(scope: string, initial: T): [T, (next: T) => void] {
  const key = uiStateKey(scope);
  const raw = useSyncExternalStore(subscribe, () => read(key), onServer);
  // `initial` is usually a fresh literal each render; its JSON is the stable identity.
  const fallback = JSON.stringify(initial);
  const value = useMemo(() => parseStored(raw, JSON.parse(fallback) as T), [raw, fallback]);
  const set = useCallback(
    (next: T) => {
      write(key, JSON.stringify(next));
    },
    [key]
  );
  return [value, set];
}

/** useSessionState for one element of the current page, shared by every language of it. */
export function usePageSessionState<T>(id: string, initial: T): [T, (next: T) => void] {
  return useSessionState(pageScope(usePathname(), id), initial);
}
