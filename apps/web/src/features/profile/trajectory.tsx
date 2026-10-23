import { localize, type Organization, type Profile } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

import { type Lane, laneBg, laneOf, laneText } from "@/components/lane";
import { OrganizationMark } from "@/features/career/organization-mark";
import { RevealItem, RevealList } from "@/components/motion/reveal";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { formatYearSpan } from "@/lib/dates";
import { describeEntity } from "@/lib/entities";

/**
 * The career arc as a metro line, newest station first, like the career page.
 * The line starts at "now" and fades out into the past: right on wide
 * screens, down on phones. Each station links to its evidence.
 */
export async function Trajectory({ steps, label }: { steps: Profile["trajectory"]; label: string }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Common")]);
  const content = getContent();
  const stations = steps
    .map((step) => {
      const entity = step.ref !== undefined ? describeEntity(step.ref, locale) : undefined;
      const lane: Lane = entity !== undefined && entity.type in laneOf ? laneOf[entity.type as keyof typeof laneOf] : "career";
      const experience = entity?.type === "experience" ? content.getExperience(entity.id) : undefined;
      const organization: Organization | undefined = experience && content.getOrganization(experience.organization);
      const start = experience?.positions[0]?.start;
      const end = experience?.positions.at(-1)?.end;
      return {
        label: localize(step.label, locale).value,
        entity,
        lane,
        organization,
        years: start !== undefined ? formatYearSpan(start, end) : undefined,
        current: experience !== undefined && end === undefined,
      };
    })
    .reverse();

  return (
    <RevealList aria-label={label} className="glass grid rounded-xl border p-5 sm:grid-cols-5 sm:p-6">
      {stations.map((station, index) => {
        const last = index === stations.length - 1;
        const body = (
          <>
            <span aria-hidden className="relative mt-1 flex size-3 shrink-0">
              {station.current && <span className="absolute inset-0 rounded-full bg-brand opacity-60 motion-safe:animate-ping" />}
              <span
                className={cn(
                  "relative size-3 rounded-full border-2 transition-colors",
                  station.current
                    ? "border-brand bg-brand"
                    : cn("bg-background", laneText[station.lane], "border-current group-hover:bg-current")
                )}
              />
            </span>
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className="text-base leading-tight font-semibold sm:text-lg text-balance group-hover:underline group-hover:underline-offset-4 sm:text-lg">
                {station.label}
              </span>
              {station.organization !== undefined ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <OrganizationMark organization={station.organization} size="sm" />
                  <span className="truncate">{station.organization.name}</span>
                </span>
              ) : (
                station.entity !== undefined && <span className="text-sm text-muted-foreground">{station.entity.title}</span>
              )}
              {station.years !== undefined && (
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
                  {station.years}
                  {station.current && (
                    <span className="rounded-full bg-brand/15 px-1.5 py-px font-sans text-[0.7rem] font-semibold text-foreground">
                      {t("now")}
                    </span>
                  )}
                </span>
              )}
            </span>
          </>
        );
        return (
          <RevealItem key={station.entity?.id ?? station.label} className={cn("relative pb-6 sm:pr-4 sm:pb-0", last && "pb-0")}>
            <span
              aria-hidden
              className={cn(
                "absolute top-4 bottom-0 left-[5px] w-0.5 sm:top-[9px] sm:right-0 sm:bottom-auto sm:left-1.5 sm:h-0.5 sm:w-auto",
                last ? "max-sm:hidden sm:bg-linear-to-r sm:from-lane-career/60 sm:to-transparent" : cn(laneBg[station.lane], "opacity-60")
              )}
            />
            {station.entity?.href !== undefined ? (
              <Link href={station.entity.href} className="group relative flex gap-3 rounded-lg sm:flex-col">
                {body}
              </Link>
            ) : (
              <div className="relative flex gap-3 sm:flex-col">{body}</div>
            )}
          </RevealItem>
        );
      })}
    </RevealList>
  );
}
