import { localize, type Profile } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";
import { getLocale } from "next-intl/server";

import { LaneDot, laneOf, laneText } from "@/components/lane";
import { Link } from "@/i18n/navigation";
import { describeEntity } from "@/lib/entities";

/**
 * The career arc as an ordered path. Order carries meaning here (each step
 * led to the next), so the steps are numbered; each links to its evidence.
 */
export async function Trajectory({ steps, label }: { steps: Profile["trajectory"]; label: string }) {
  const locale = await getLocale();
  return (
    <ol aria-label={label} className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-5">
      {steps.map((step, index) => {
        const entity = step.ref !== undefined ? describeEntity(step.ref, locale) : undefined;
        const lane = entity !== undefined && entity.type in laneOf ? laneOf[entity.type as keyof typeof laneOf] : "career";
        const body = (
          <>
            <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
              <LaneDot lane={lane} />
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-lg leading-tight font-semibold">{localize(step.label, locale).value}</span>
            {entity !== undefined && <span className={cn("text-sm", laneText[lane])}>{entity.title}</span>}
          </>
        );
        return (
          <li key={index} className="bg-card">
            {entity?.href !== undefined ? (
              <Link href={entity.href} className="flex h-full flex-col gap-2 p-4 transition-colors hover:bg-accent">
                {body}
              </Link>
            ) : (
              <div className="flex h-full flex-col gap-2 p-4">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
