"use client";

import { cn } from "@workspace/ui/lib/utils";
import { type Transition, useReducedMotion, type Variants } from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";

/*
 * State icons: the controls whose icon says what state they are in (copied,
 * the theme, the menu open) swap it with a short Motion animation instead of
 * a cut. See docs/decisions/0007-visual-system.md, "motion language for icons".
 *
 * Shapes are Lucide's (ISC licence), redrawn as m.* elements so they can move;
 * timings follow lucide-animated (MIT). Everything stays at or under 250 ms.
 * MotionConfig reducedMotion="user" already turns transforms into jumps, but
 * not opacity, pathLength or a path's d, so each icon also asks
 * useReducedMotion() and then swaps at once.
 */

const SVG = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

const EASE_OUT: Transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] };
const SPRING: Transition = { type: "spring", duration: 0.25, bounce: 0.25 };
const INSTANT: Transition = { duration: 0 };

function useStateTransition(transition: Transition): Transition {
  return useReducedMotion() === true ? INSTANT : transition;
}

/** Copy → check: the two sheets shrink away and the tick draws itself. */
export function CopyStateIcon({ copied, className }: { copied: boolean; className?: string }) {
  const transition = useStateTransition(EASE_OUT);
  return (
    <svg {...SVG} data-state={copied ? "copied" : "idle"} className={cn("size-4", className)}>
      <m.g initial={false} animate={copied ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }} transition={transition}>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </m.g>
      <m.path
        d="M20 6 9 17l-5-5"
        initial={false}
        animate={copied ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={transition}
      />
    </svg>
  );
}

export type ThemeChoice = "light" | "dark" | "system";

const SHAPES: Record<ThemeChoice, ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  dark: <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />,
  system: (
    <>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
};

/** Before hydration the choice is unknown, so CSS shows the sun or the moon by the theme on <html>. */
const BEFORE_HYDRATION: Record<ThemeChoice, string> = { light: "dark:hidden", dark: "hidden dark:block", system: "hidden" };

const swap: Variants = {
  shown: { opacity: 1, rotate: 0, scale: 1 },
  hidden: { opacity: 0, rotate: -90, scale: 0.5 },
};

/**
 * Sun, moon or monitor for the chosen theme; the old one turns away and
 * shrinks while the new one turns in. `choice` is undefined until hydration.
 */
export function ThemeStateIcon({ choice, className }: { choice: ThemeChoice | undefined; className?: string }) {
  const transition = useStateTransition(SPRING);
  return (
    // Remounted once the choice is known, so the first state appears without animating.
    <span
      key={choice === undefined ? "static" : "live"}
      data-theme-icon={choice}
      className={cn("grid size-4 *:col-start-1 *:row-start-1", className)}
    >
      {(Object.keys(SHAPES) as ThemeChoice[]).map((value) => (
        <m.svg
          key={value}
          {...SVG}
          className={cn("size-4", choice === undefined && BEFORE_HYDRATION[value])}
          variants={swap}
          initial={false}
          animate={choice === undefined ? undefined : choice === value ? "shown" : "hidden"}
          transition={transition}
        >
          {SHAPES[value]}
        </m.svg>
      ))}
    </span>
  );
}

/** Menu ↔ close: the outer bars turn into the cross, the middle one fades. */
export function MenuStateIcon({ open, className }: { open: boolean; className?: string }) {
  const transition = useStateTransition(EASE_OUT);
  return (
    <svg {...SVG} data-state={open ? "open" : "closed"} className={cn("size-4", className)}>
      <m.path initial={false} animate={{ d: open ? "M6 6L18 18" : "M4 5L20 5" }} transition={transition} />
      <m.path initial={false} animate={{ opacity: open ? 0 : 1 }} transition={transition} d="M4 12L20 12" />
      <m.path initial={false} animate={{ d: open ? "M6 18L18 6" : "M4 19L20 19" }} transition={transition} />
    </svg>
  );
}

const tilt: Variants = { rest: { rotate: 0, scale: 1 }, hover: { rotate: -14, scale: 1.08 } };

/**
 * The search lens, which tilts while its button is hovered or focused. It
 * follows the parent's "rest"/"hover" variants (see MotionButton).
 */
export function SearchLensIcon({ className }: { className?: string }) {
  return (
    <m.svg {...SVG} variants={tilt} transition={SPRING} className={cn("size-4", className)}>
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </m.svg>
  );
}
