import { type TimelineEvent, localize } from "@workspace/content";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

import { DateRange, PartialDate } from "@/components/date-range";
import { type Lane, laneBg, laneOf, laneText } from "@/components/lane";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { describeEntity } from "@/lib/entities";

export const LANES: readonly Lane[] = ["career", "project", "study", "writing"];

interface Row {
  event: TimelineEvent;
  lane: Lane;
  title: string;
  subtitle?: string | undefined;
  href?: string | undefined;
}

/**
 * The hub's signature view: entries drawn as a commit graph, one lane per kind
 * (career, projects, studies, writing), newest first, grouped by year. A
 * hollow node marks a date taken from the repository, not from the content.
 */
export async function CommitGraph({
  events,
  groupByYear = true,
  label,
}: {
  events: TimelineEvent[];
  groupByYear?: boolean;
  label: string;
}) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Timeline")]);
  const content = getContent();

  const rows: Row[] = events.flatMap((event) => {
    const entity = describeEntity(event.entity.id, locale);
    if (entity === undefined) return [];
    const lane = laneOf[event.kind === "position" ? "experience" : event.kind];
    if (event.kind === "position" && event.positionIndex !== undefined) {
      const position = content.getExperience(event.entity.id)?.positions[event.positionIndex];
      return [{ event, lane, title: entity.title, subtitle: position && localize(position.title, locale).value, href: entity.href }];
    }
    return [{ event, lane, title: entity.title, subtitle: event.kind === "project" ? undefined : entity.subtitle, href: entity.href }];
  });

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = groupByYear ? row.event.date.slice(0, 4) : "";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return (
    <div aria-label={label} role="region">
      {[...groups].map(([year, items]) => (
        <section key={year} aria-label={year || undefined}>
          {groupByYear && (
            <h2 className="sticky top-14 z-10 -mx-1 bg-background/90 px-1 py-2 font-mono text-sm font-medium backdrop-blur">{year}</h2>
          )}
          <ol>
            {items.map((row) => {
              const laneIndex = LANES.indexOf(row.lane);
              const fromRepository = row.event.dateSource === "repository-created";
              return (
                <li
                  key={row.event.key}
                  className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[6.5rem_6rem_minmax(0,1fr)] sm:gap-x-4"
                >
                  <div className="hidden pt-3 text-right sm:block">
                    <PartialDate date={row.event.date} />
                  </div>
                  {/* The graph: four lane rails, one node on this entry's lane. */}
                  <div aria-hidden className="relative grid grid-cols-4">
                    {LANES.map((lane, index) => (
                      <div key={lane} className="relative flex justify-center">
                        <span className={cn("absolute inset-y-0 w-0.5 opacity-25", laneBg[lane])} />
                        {index === laneIndex && (
                          <span
                            className={cn(
                              "relative mt-4 size-3 rounded-full ring-4 ring-background",
                              fromRepository ? cn("border-2 bg-background", laneText[lane], "border-current") : laneBg[lane]
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 border-b py-2.5">
                    <p className={cn("font-mono text-[0.7rem] tracking-wide uppercase", laneText[row.lane])}>
                      <span className="sm:hidden">
                        <PartialDate date={row.event.date} />
                        {" · "}
                      </span>
                      {row.event.kind === "position" ? t("legendCareer") : t(`kind.${row.event.kind}`)}
                    </p>
                    <p className="font-medium">
                      {row.href !== undefined ? (
                        <Link href={row.href} className="hover:underline hover:underline-offset-4">
                          {row.title}
                        </Link>
                      ) : (
                        row.title
                      )}
                    </p>
                    {row.subtitle !== undefined && <p className="line-clamp-1 text-sm text-muted-foreground">{row.subtitle}</p>}
                    {row.event.kind === "position" && row.event.end !== undefined && (
                      <DateRange start={row.event.date} end={row.event.end} />
                    )}
                    {fromRepository && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="mt-0.5 cursor-help font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-4"
                          >
                            {t("repositoryCreated")}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">{t("repositoryCreatedHint")}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export async function LaneLegend() {
  const t = await getTranslations("Timeline");
  const keys = { career: "legendCareer", project: "kind.project", study: "legendStudy", writing: "kind.post" } as const;
  return (
    <ul aria-label={t("legend")} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {LANES.map((lane) => (
        <li key={lane} className="flex items-center gap-2">
          <span aria-hidden className={cn("size-2.5 rounded-full", laneBg[lane])} />
          {t(keys[lane])}
        </li>
      ))}
    </ul>
  );
}
