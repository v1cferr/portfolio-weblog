import type { Experience } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";

import { ExperienceCard } from "./experience-card";

/**
 * Career as a single-lane commit graph: one node per organization on a
 * vertical rail, newest at the top.
 */
export function CareerTimeline({ experiences }: { experiences: Experience[] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-lane-career/30 pl-6 md:pl-8">
      {experiences.map((experience) => (
        <li key={experience.id} className="relative">
          <span
            aria-hidden
            className={cn(
              "absolute top-7 -left-[calc(1.5rem+7px)] size-3 rounded-full md:-left-[calc(2rem+7px)]",
              experience.positions.at(-1)?.end === undefined ? "bg-brand ring-4 ring-brand/20" : "bg-lane-career ring-4 ring-lane-career/15"
            )}
          />
          <div className="relative">
            <ExperienceCard experience={experience} />
          </div>
        </li>
      ))}
    </ol>
  );
}
