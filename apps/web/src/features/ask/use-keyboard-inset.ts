import { useEffect } from "react";

/**
 * How much of the layout viewport the on-screen keyboard covers, written to
 * `--ask-keyboard` on <html> while `active` (the phone sheet reads it; it is
 * portaled, so the root is where it can always inherit it). Android Chrome
 * resizes the layout itself (`interactiveWidget: "resizes-content"` in the
 * locale layout), so there it stays 0; iOS Safari only shrinks the visual
 * viewport, so the sheet lifts by the difference and its input stays above
 * the keyboard.
 */
export function useKeyboardInset(active: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || viewport === null) return;
    const root = document.documentElement;
    const update = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      root.style.setProperty("--ask-keyboard", `${String(Math.round(covered))}px`);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--ask-keyboard");
    };
  }, [active]);
}
