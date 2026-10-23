import { type TimelineEvent, localize } from "@workspace/content";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { CircleDashedIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { type Lane, laneBg, LaneIcon, laneOf, laneText } from "@/components/lane";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { formatDayMonth } from "@/lib/dates";
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

  // Inside a year group the year is in the heading; without groups it stays.
  const short = (date: string, withYear = !groupByYear) => (
    <time dateTime={date} className="whitespace-nowrap">
      {[formatDayMonth(date, locale), withYear ? date.slice(0, 4) : ""].filter(Boolean).join(" ")}
    </time>
  );

  return (
    <div aria-label={label} role="region" className={groupByYear ? "[--date-col:4.5rem]" : "[--date-col:6rem]"}>
      {[...groups].map(([year, items]) => (
        <section key={year} aria-label={year || undefined} className="pb-4">
          {groupByYear && (
            <h2
              aria-label={`${year}, ${t("entries", { count: items.length })}`}
              className="glass sticky top-17 z-10 my-3 w-fit rounded-full border px-3 py-1 font-mono text-sm font-medium tabular-nums"
            >
              {year}
              <span aria-hidden className="text-muted-foreground">
                {" · "}
                {items.length}
              </span>
            </h2>
          )}
          <ol>
            {items.map((row) => {
              const laneIndex = LANES.indexOf(row.lane);
              const fromRepository = row.event.dateSource === "repository-created";
              const end = row.event.kind === "position" ? row.event.end : undefined;
              return (
                <li
                  key={row.event.key}
                  className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[var(--date-col)_6rem_minmax(0,1fr)] sm:gap-x-4"
                >
                  <div className="hidden pt-3.5 text-right font-mono text-xs text-muted-foreground tabular-nums sm:block">
                    {short(row.event.date)}
                  </div>
                  {/* The graph: four lane rails, one node on this entry's lane. */}
                  <div aria-hidden className="relative grid grid-cols-4">
                    {LANES.map((lane, index) => (
                      <div key={lane} className="relative flex justify-center">
                        <span className={cn("absolute inset-y-0 w-0.5 opacity-25", laneBg[lane])} />
                        {index === laneIndex && (
                          <span
                            className={cn(
                              "relative mt-4 size-3 rounded-full ring-4 ring-current/15",
                              laneText[lane],
                              fromRepository ? "border-2 border-current bg-background" : "bg-current"
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 border-b border-border/50 py-2.5">
                    <p className={cn("flex items-center gap-1.5 font-mono text-[0.7rem] tracking-wide uppercase", laneText[row.lane])}>
                      <LaneIcon lane={row.lane} className="size-3" />
                      <span className="text-muted-foreground sm:hidden">
                        {short(row.event.date)}
                        {" · "}
                      </span>
                      {row.event.kind === "position" ? t("legendCareer") : t(`kind.${row.event.kind}`)}
                      {fromRepository && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={t("repositoryCreated")}
                              className="cursor-help rounded-sm text-muted-foreground"
                            >
                              <CircleDashedIcon aria-hidden className="size-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64 normal-case">{t("repositoryCreatedHint")}</TooltipContent>
                        </Tooltip>
                      )}
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
                    {end !== undefined && (
                      <p className="font-mono text-xs text-muted-foreground tabular-nums">
                        {short(row.event.date, false)} – {short(end, false)}
                        {end.slice(0, 4) !== row.event.date.slice(0, 4) && ` ${end.slice(0, 4)}`}
                      </p>
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
          <LaneIcon lane={lane} className="size-4" />
          {t(keys[lane])}
        </li>
      ))}
      <li className="flex items-center gap-2 text-muted-foreground">
        <CircleDashedIcon aria-hidden className="size-4" />
        {t("repositoryLegend")}
      </li>
    </ul>
  );
}
