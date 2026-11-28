import type { ProjectState } from "@workspace/content";

/**
 * A project the content calls in progress ("active" or "experimental") whose
 * repository has had no push for this long is shown as having no updates
 * (2026-11-28, the owner's call: three months, so a short pause is not called
 * stale). A finished project is marked "maintained" or "stable" instead and
 * never gets the badge.
 */
export const STALE_AFTER_DAYS = 90;

const IN_PROGRESS: ReadonlySet<ProjectState> = new Set(["active", "experimental"]);

/** The month of the last push ("2026-06") when the project is stale, else undefined. */
export function staleSince(state: ProjectState, pushedAt: string | null | undefined, now: Date): string | undefined {
  if (!IN_PROGRESS.has(state) || pushedAt === null || pushedAt === undefined) return undefined;
  const pushed = new Date(pushedAt);
  if (Number.isNaN(pushed.getTime())) return undefined;
  const days = (now.getTime() - pushed.getTime()) / 86_400_000;
  return days > STALE_AFTER_DAYS ? pushedAt.slice(0, 7) : undefined;
}
