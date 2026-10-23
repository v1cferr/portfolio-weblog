import type { Experience } from "@workspace/content";

import { RailTimeline } from "@/components/rail-timeline";

import { ExperienceCard } from "./experience-card";

/** Career as a single-lane commit graph: one node per organization, newest at the top. */
export function CareerTimeline({ experiences }: { experiences: Experience[] }) {
  return (
    <RailTimeline
      lane="career"
      entries={experiences.map((experience) => ({
        key: experience.id,
        node: experience.positions.at(-1)?.end === undefined ? "current" : "past",
        children: <ExperienceCard experience={experience} />,
      }))}
    />
  );
}
