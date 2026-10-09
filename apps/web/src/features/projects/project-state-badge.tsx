import { Badge } from "@workspace/ui/components/badge";
import type { ProjectState } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";

const tone: Record<ProjectState, string> = {
  active: "border-lane-career/40 text-lane-career",
  maintained: "border-lane-career/40 text-lane-career",
  stable: "border-lane-project/40 text-lane-project",
  experimental: "border-lane-study/40 text-lane-study",
  paused: "text-muted-foreground",
  historical: "text-muted-foreground",
  archived: "text-muted-foreground",
};

/** Editorial state of a project; colour groups "alive", "settled" and "trying out". */
export function ProjectStateBadge({ state, label }: { state: ProjectState; label: string }) {
  return (
    <Badge variant="outline" className={cn("font-mono text-[0.7rem] font-normal", tone[state])}>
      {label}
    </Badge>
  );
}
