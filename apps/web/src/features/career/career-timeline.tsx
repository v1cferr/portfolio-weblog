import type { Experience } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";

import { RevealItem, RevealList } from "@/components/motion/reveal";

import { ExperienceCard } from "./experience-card";

/**
 * Career as a single-lane commit graph: one node per organization on a
 * vertical rail, newest at the top.
 */
export function CareerTimeline({ experiences }: { experiences: Experience[] }) {
  return (
    <div className="relative">
      {/* The rail sits outside the list: an <ol> may only hold items. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-lane-career/15">
        <span className="draw-on-scroll absolute inset-0 block bg-lane-career/60" />
      </span>
      <RevealList className="space-y-6 pl-6 md:pl-8">
        {experiences.map((experience) => (
          <RevealItem key={experience.id} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute top-7 -left-[calc(1.5rem+5px)] size-3 rounded-full md:-left-[calc(2rem+5px)]",
                experience.positions.at(-1)?.end === undefined
                  ? "bg-brand ring-4 ring-brand/20"
                  : "bg-lane-career ring-4 ring-lane-career/15"
              )}
            />
            <div className="relative">
              <ExperienceCard experience={experience} />
            </div>
          </RevealItem>
        ))}
      </RevealList>
    </div>
  );
}
