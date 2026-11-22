"use client";

import { useEffect } from "react";

/**
 * Feeds the pointer position to CSS as --spot-x/--spot-y on :root, once per
 * frame. Every .glass surface paints one shared spotlight from it (a
 * viewport-fixed radial gradient), so this costs one listener for the whole
 * page. Off on touch screens and with reduced motion: the surfaces then stay
 * plain.
 */
export function Spotlight() {
  useEffect(() => {
    const allowed = window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)");
    if (!allowed.matches) return;
    const root = document.documentElement;
    let frame = 0;
    let x = 0;
    let y = 0;
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty("--spot-x", `${String(x)}px`);
        root.style.setProperty("--spot-y", `${String(y)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
