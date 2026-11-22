import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

import type { Lane } from "@/components/lane";

/*
 * The home page as a git log: one main line runs down the left margin from the
 * hero (HEAD) to the end, and each section branches off it on its own lane.
 * Lines draw themselves as they scroll in (CSS scroll-driven animation, no
 * JavaScript); without support, or with reduced motion, they are simply drawn.
 * Wide screens only: on phones the margin goes back to the content.
 */

const laneStroke: Record<Lane, string> = {
  career: "stroke-lane-career",
  project: "stroke-lane-project",
  study: "stroke-lane-study",
  writing: "stroke-lane-writing",
};
const laneFill: Record<Lane, string> = {
  career: "fill-lane-career",
  project: "fill-lane-project",
  study: "fill-lane-study",
  writing: "fill-lane-writing",
};

export function GitSpine({ children }: { children: ReactNode }) {
  return (
    <div className="relative lg:pl-16">
      <span aria-hidden className="absolute top-3 bottom-0 left-[11px] hidden w-0.5 bg-foreground/10 lg:block">
        <span className="draw-on-scroll absolute inset-0 block bg-linear-to-b from-brand/70 via-foreground/25 to-foreground/5" />
      </span>
      {children}
    </div>
  );
}

/** The HEAD commit: a vermilion node on the main line, level with the hero's first line. */
export function SpineHead() {
  return (
    <span aria-hidden className="absolute top-1.5 -left-16 hidden size-6 items-center justify-center lg:flex">
      <span className="absolute size-6 rounded-full bg-brand/20 motion-safe:animate-ping" />
      <span className="relative size-3 rounded-full bg-brand ring-4 ring-brand/25" />
    </span>
  );
}

/**
 * A branch from the main line to a section heading, in the section's lane.
 * With `merge`, the branch ends in all four lane colours: the section that
 * mixes every kind of entry.
 */
export function SpineBranch({ lane, merge = false }: { lane?: Lane; merge?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 40"
      className="pointer-events-none absolute -top-2 -left-16 hidden h-10 w-16 overflow-visible lg:block"
      fill="none"
    >
      <path
        pathLength={1}
        d={merge ? "M 12 0 C 12 16, 16 14, 20 18" : "M 12 0 C 12 18, 40 12, 52 18"}
        className={cn("draw-path", merge ? "stroke-foreground/40" : laneStroke[lane ?? "career"])}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {merge ? (
        (["career", "project", "study", "writing"] as const).map((each, index) => (
          <circle key={each} cx={24 + index * 7} cy={18} r={2.5} className={laneFill[each]} />
        ))
      ) : (
        <circle cx={54} cy={18} r={4} className={laneFill[lane ?? "career"]} />
      )}
      <circle cx={12} cy={2} r={3} className="fill-foreground/40" />
    </svg>
  );
}
