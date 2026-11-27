import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query matches, kept in sync with the window. False on the
 * server and during hydration, so the first client render matches the HTML;
 * the real value follows right after.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => {
        list.removeEventListener("change", onChange);
      };
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
