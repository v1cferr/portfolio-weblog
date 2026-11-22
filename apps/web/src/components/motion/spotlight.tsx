"use client";

import { useEffect } from "react";

/**
 * Feeds the pointer position to CSS as --spot-x/--spot-y on :root, once per
 * frame. Every .glass surface paints one shared spotlight from it (a
 * viewport-fixed radial gradient), so this costs one listener for the whole
 * page. Elements marked [data-spotlight-local] (the logos behind the hero)
 * also get --spot-local-x/-y in their own coordinates, to mask a reveal.
 * Off on touch screens and with reduced motion; :root[data-spotlight] tells
 * CSS when it is on.
 */
export function Spotlight() {
  useEffect(() => {
    const allowed = window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)");
    if (!allowed.matches) return;
    const root = document.documentElement;
    root.dataset.spotlight = "";
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
        for (const element of document.querySelectorAll<HTMLElement>("[data-spotlight-local]")) {
          const box = element.getBoundingClientRect();
          element.style.setProperty("--spot-local-x", `${String(x - box.left)}px`);
          element.style.setProperty("--spot-local-y", `${String(y - box.top)}px`);
        }
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
      delete root.dataset.spotlight;
    };
  }, []);
  return null;
}
