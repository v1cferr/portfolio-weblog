"use client";

import { useEffect, useState } from "react";

/** How long a wait must last before any loading indicator shows. */
export const LOADING_DELAY_MS = 300;

/**
 * True once `active` has stayed true for `delay` ms, false as soon as it turns
 * false. Loading indicators use it so a fast response never flashes one.
 */
export function useDelayed(active: boolean, delay = LOADING_DELAY_MS): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      setShown(true);
    }, delay);
    return () => {
      clearTimeout(timer);
      setShown(false);
    };
  }, [active, delay]);
  return active && shown;
}
