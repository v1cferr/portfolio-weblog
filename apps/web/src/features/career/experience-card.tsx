import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { type Experience, localize } from "@workspace/content";
import { ArrowRightIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { DateRange } from "@/components/date-range";
import { TechList } from "@/components/tech-list";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";

import { OrganizationMark } from "./organization-mark";

/** One organization with every position held there, newest position first. */
export async function ExperienceCard({ experience }: { experience: Experience }) {
  const [locale, t, common] = await Promise.all([getLocale(), getTranslations("Career"), getTranslations("Common")]);
  const organization = getContent().getOrganization(experience.organization);
  if (organization === undefined) return null;
  const positions = [...experience.positions].reverse();

  return (
    <Card className="relative gap-4 py-5 transition-colors hover:border-foreground/25">
      <CardHeader className="flex flex-row items-start gap-3 px-5">
        <OrganizationMark organization={organization} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl leading-tight font-semibold">
            <Link href={`/career/${experience.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {organization.name}
            </Link>
          </h3>
          <ol aria-label={t("positions")} className="mt-2 space-y-1.5">
            {positions.map((position) => (
              <li
                key={`${position.start ?? ""}-${localize(position.title, "en-us").value}`}
                className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3"
              >
                <span className="font-medium">
                  {localize(position.title, locale).value}
                  {position.employmentType !== undefined && (
                    <span className="text-muted-foreground"> · {t(`employmentType.${position.employmentType}`)}</span>
                  )}
                </span>
                {position.start !== undefined && <DateRange start={position.start} end={position.end} showDuration />}
              </li>
            ))}
          </ol>
        </div>
        <ArrowRightIcon aria-hidden className="mt-1 size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="relative z-10 space-y-4 px-5">
        <p className="text-pretty text-muted-foreground">{localize(experience.summary, locale).value}</p>
        <TechList ids={experience.technologies.slice(0, 8)} label={common("technologies")} />
      </CardContent>
    </Card>
  );
}
