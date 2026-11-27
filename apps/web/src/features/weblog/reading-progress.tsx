"use client";

import { useEffect, useRef } from "react";

/**
 * A thin bar at the top of the viewport that fills as the reader moves
 * through the article (the element with `targetId`), not the whole page:
 * it is full when the article's end reaches the bottom of the screen.
 * Decorative, so screen readers skip it; the scroll position already tells
 * them where they are. It follows the scroll directly, without easing, so
 * there is no animation for reduced motion to turn off.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = document.getElementById(targetId);
    const element = bar.current;
    if (target === null || element === null) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, height } = target.getBoundingClientRect();
      const total = height - window.innerHeight;
      const done = total <= 0 ? (top <= 0 ? 1 : 0) : Math.min(1, Math.max(0, -top / total));
      element.style.transform = `scaleX(${done})`;
      element.dataset.progress = done.toFixed(2);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [targetId]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div ref={bar} data-testid="reading-progress" className="h-full origin-left bg-lane-writing" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
