import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { type Experience, localize } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { DateRange } from "@/components/date-range";
import { TechList } from "@/components/tech-list";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { formatMonthRange } from "@/lib/dates";

import { OrganizationMark } from "./organization-mark";

const TECH_LIMIT = 6;

/**
 * One organization with every position held there, as a ladder: newest
 * position on top, linked by a short rail so promotions read as a path. The
 * current position is marked in vermilion, as on the trajectory.
 */
export async function ExperienceCard({ experience }: { experience: Experience }) {
  const [locale, t, common] = await Promise.all([getLocale(), getTranslations("Career"), getTranslations("Common")]);
  const organization = getContent().getOrganization(experience.organization);
  if (organization === undefined) return null;
  const positions = [...experience.positions].reverse();
  const start = experience.positions[0]?.start;
  const end = positions[0]?.end;
  const ladder = positions.length > 1;
  const href = `/career/${experience.id}`;

  return (
    <Card
      variant="glass"
      className="relative gap-4 py-5 hover:border-foreground/25 transition-[translate,border-color] duration-200 [@media(hover:hover)]:hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
    >
      <CardHeader className="flex flex-row items-start gap-3 px-5">
        <OrganizationMark organization={organization} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl leading-tight font-semibold">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {organization.name}
            </Link>
          </h3>
          {start !== undefined && (
            <p className="mt-0.5">
              <DateRange start={start} end={end} showDuration compact />
            </p>
          )}
        </div>
        <ArrowRightIcon aria-hidden className="mt-1 size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="relative z-10 space-y-4 px-5">
        <ol aria-label={t("positions")} className="space-y-3">
          {positions.map((position, index) => {
            const current = position.end === undefined;
            const last = index === positions.length - 1;
            return (
              <li key={`${position.start ?? ""}-${localize(position.title, "en-us").value}`} className="relative flex gap-3">
                {ladder && (
                  <span aria-hidden className="relative flex w-3 shrink-0 justify-center pt-1.5">
                    {!last && <span className="absolute top-4 -bottom-4 w-0.5 bg-lane-career/40" />}
                    <span
                      className={cn(
                        "relative size-2.5 rounded-full",
                        current ? "bg-brand ring-4 ring-brand/20" : "border-2 border-lane-career bg-background"
                      )}
                    />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="leading-snug">
                    <span className="font-medium">{localize(position.title, locale).value}</span>
                    {position.employmentType !== undefined && (
                      <span className="text-muted-foreground"> · {t(`employmentType.${position.employmentType}`)}</span>
                    )}
                    {current && (
                      <span className="ml-2 rounded-full bg-brand/15 px-1.5 py-px align-middle text-[0.7rem] font-semibold">
                        {common("now")}
                      </span>
                    )}
                  </p>
                  {position.start !== undefined && (
                    <p className="font-mono text-xs text-muted-foreground tabular-nums">
                      {formatMonthRange(position.start, position.end, locale, common("present"))}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-pretty text-muted-foreground">{localize(experience.summary, locale).value}</p>
        <TechList
          ids={experience.technologies}
          label={common("technologies")}
          limit={TECH_LIMIT}
          moreHref={href}
          moreLabel={common("moreTechnologies", { count: Math.max(experience.technologies.length - TECH_LIMIT, 0) })}
        />
      </CardContent>
    </Card>
  );
}
