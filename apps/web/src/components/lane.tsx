import { cn } from "@workspace/ui/lib/utils";
import { BriefcaseBusinessIcon, FolderGit2Icon, GraduationCapIcon, type LucideIcon, PenLineIcon } from "lucide-react";

export type Lane = "career" | "project" | "study" | "writing";

/** Maps each entity kind to the lane colour it owns across the site. */
export const laneOf = {
  experience: "career",
  project: "project",
  education: "study",
  certification: "study",
  post: "writing",
} as const satisfies Record<string, Lane>;

export const laneText: Record<Lane, string> = {
  career: "text-lane-career",
  project: "text-lane-project",
  study: "text-lane-study",
  writing: "text-lane-writing",
};

export const laneBg: Record<Lane, string> = {
  career: "bg-lane-career",
  project: "bg-lane-project",
  study: "bg-lane-study",
  writing: "bg-lane-writing",
};

export function LaneDot({ lane, className }: { lane: Lane; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", laneBg[lane], className)} />;
}

/** One icon per kind of entry, used wherever the kind is named. */
export const laneIcon: Record<Lane, LucideIcon> = {
  career: BriefcaseBusinessIcon,
  project: FolderGit2Icon,
  study: GraduationCapIcon,
  writing: PenLineIcon,
};

export function LaneIcon({ lane, className }: { lane: Lane; className?: string }) {
  const Glyph = laneIcon[lane];
  return <Glyph aria-hidden className={cn("size-3.5 shrink-0", laneText[lane], className)} />;
}
