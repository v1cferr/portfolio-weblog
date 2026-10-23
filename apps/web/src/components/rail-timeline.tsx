import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

import type { Lane } from "@/components/lane";
import { RevealItem, RevealList } from "@/components/motion/reveal";

/** How an entry's node is drawn: the vermilion "now", a dated past entry, or one with no recorded dates. */
export type RailNode = "current" | "past" | "undated";

export interface RailEntry {
  key: string;
  node: RailNode;
  /** Anchor id, so other pages can link to the entry. */
  id?: string;
  children: ReactNode;
}

// Literal class names per lane, so Tailwind sees every one of them.
const rail: Record<Lane, { track: string; drawn: string; past: string; undated: string }> = {
  career: {
    track: "bg-lane-career/15",
    drawn: "bg-lane-career/60",
    past: "bg-lane-career ring-lane-career/15",
    undated: "border-lane-career/50",
  },
  project: {
    track: "bg-lane-project/15",
    drawn: "bg-lane-project/60",
    past: "bg-lane-project ring-lane-project/15",
    undated: "border-lane-project/50",
  },
  study: {
    track: "bg-lane-study/15",
    drawn: "bg-lane-study/60",
    past: "bg-lane-study ring-lane-study/15",
    undated: "border-lane-study/50",
  },
  writing: {
    track: "bg-lane-writing/15",
    drawn: "bg-lane-writing/60",
    past: "bg-lane-writing ring-lane-writing/15",
    undated: "border-lane-writing/50",
  },
};

/**
 * A single-lane timeline: one vertical rail in the lane's colour, newest entry
 * on top. The caller orders the entries; the rail draws itself on scroll.
 */
export function RailTimeline({
  lane,
  entries,
  label,
  nodeClassName = "top-7",
  gapClassName = "space-y-6",
}: {
  lane: Lane;
  entries: RailEntry[];
  label?: string;
  /** Vertical position of the nodes, to line up with the first line of each entry. */
  nodeClassName?: string;
  gapClassName?: string;
}) {
  const colors = rail[lane];
  return (
    <div className="relative">
      {/* The rail sits outside the list: an <ol> may only hold items. */}
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-0.5", colors.track)}>
        <span className={cn("draw-on-scroll absolute inset-0 block", colors.drawn)} />
      </span>
      <RevealList aria-label={label} className={cn("pl-6 md:pl-8", gapClassName)}>
        {entries.map((entry) => (
          <RevealItem key={entry.key} id={entry.id} className="relative scroll-mt-24">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[calc(1.5rem+5px)] size-3 rounded-full md:-left-[calc(2rem+5px)]",
                nodeClassName,
                entry.node === "current" && "bg-brand ring-4 ring-brand/20",
                entry.node === "past" && cn("ring-4", colors.past),
                entry.node === "undated" && cn("border-2 bg-background", colors.undated)
              )}
            />
            <div className="relative">{entry.children}</div>
          </RevealItem>
        ))}
      </RevealList>
    </div>
  );
}
