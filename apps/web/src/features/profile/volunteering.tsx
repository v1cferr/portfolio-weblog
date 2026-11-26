import { localize } from "@workspace/content";
import { HandHeartIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { DateRange } from "@/components/date-range";
import { InfoTip } from "@/components/info-tip";
import { SectionHeading } from "@/components/page-header";
import { OrganizationMark } from "@/features/career/organization-mark";
import { getContent } from "@/lib/content";

/**
 * Volunteering on the About page, newest first: role, organization, dates and
 * cause, with what I did behind an "i". It is kept apart from the career, so
 * it has no page of its own.
 */
export async function Volunteering() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("About")]);
  const content = getContent();
  const items = content.getVolunteering();
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="volunteering" data-testid="about-volunteering">
      <SectionHeading id="volunteering" icon={HandHeartIcon}>
        {t("volunteering")}
      </SectionHeading>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const organization = content.getOrganization(item.organization);
          const position = item.positions.at(-1);
          const first = item.positions[0];
          const title = localize(position?.title ?? item.summary, locale);
          const summary = localize(item.summary, locale);
          const cause = item.cause === undefined ? undefined : localize(item.cause, locale);
          return (
            <li key={item.id} id={item.id} className="glass flex h-full gap-3 rounded-xl border p-4">
              {organization !== undefined && <OrganizationMark organization={organization} />}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="flex items-start justify-between gap-2">
                  <span className="font-medium" lang={title.locale}>
                    {title.value}
                  </span>
                  <InfoTip label={t("volunteeringMore", { role: title.value })} align="end" className="-mt-0.5">
                    <span lang={summary.locale}>{summary.value}</span>
                  </InfoTip>
                </p>
                {organization !== undefined && <p className="text-sm text-muted-foreground">{organization.name}</p>}
                {first?.start !== undefined && (
                  <p>
                    <DateRange start={first.start} end={position?.end} compact />
                  </p>
                )}
                {cause !== undefined && (
                  <p className="text-sm text-muted-foreground" lang={cause.locale}>
                    {cause.value}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
