import type { Experience, Organization } from "@workspace/content";
import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { NAV_SECTION } from "@/components/page-transition";
import { OrganizationMark } from "@/features/career/organization-mark";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { getDecisions } from "@/lib/decisions";

/** The latest start among an experience's positions ("YYYY" or "YYYY-MM"), for newest-first ordering. */
const latestStart = (experience: Experience) =>
  experience.positions.reduce((latest, position) => ((position.start ?? "") > latest ? (position.start ?? "") : latest), "");

/**
 * One line of proof under "Start here": the logos of the organizations the
 * owner has worked at (newest first, each linking to its job page), then facts
 * counted from the content: the year of the earliest position, the public
 * projects and the recorded decisions. Nothing here is typed by hand.
 */
export async function ProofLine() {
  const t = await getTranslations("Home.proof");
  const content = getContent();
  const experiences = content.getExperiences();

  const jobs = [...experiences]
    .sort((a, b) => latestStart(b).localeCompare(latestStart(a)))
    .map((experience) => ({ experience, organization: content.getOrganization(experience.organization) }))
    .filter((job): job is { experience: Experience; organization: Organization } => job.organization?.logo !== undefined);
  const starts = experiences.flatMap((experience) => experience.positions.flatMap((position) => position.start ?? []));
  const since = starts.length > 0 ? starts.reduce((earliest, start) => (start < earliest ? start : earliest)).slice(0, 4) : undefined;
  const projects = content.getProjects().length;
  const decisions = getDecisions().length;

  return (
    <section aria-label={t("label")} className="mb-16 flex flex-col gap-4 border-y py-5 lg:flex-row lg:items-center lg:justify-between">
      {jobs.length > 0 && (
        <ul aria-label={t("organizations")} className="flex flex-wrap items-center gap-2">
          {jobs.map(({ experience, organization }) => (
            <li key={experience.id}>
              <Link
                href={`/career/${experience.id}`}
                aria-label={organization.name}
                title={organization.name}
                className="flex size-11 items-center justify-center rounded-xl transition-transform hover:-translate-y-0.5 motion-reduce:transition-none"
              >
                <OrganizationMark organization={organization} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ul aria-label={t("facts")} className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm text-muted-foreground">
        {since !== undefined && <li data-fact="since">{t("since", { year: since })}</li>}
        <li data-fact="projects">
          <Link href="/projects" transitionTypes={NAV_SECTION} className="underline-offset-4 hover:text-foreground hover:underline">
            {t("projects", { count: projects })}
          </Link>
        </li>
        <li data-fact="decisions">
          <Link href="/decisions" transitionTypes={NAV_SECTION} className="underline-offset-4 hover:text-foreground hover:underline">
            {t("decisions", { count: decisions })}
          </Link>
        </li>
        <li>
          <Link
            href="/colophon"
            transitionTypes={NAV_SECTION}
            className="group/link inline-flex min-h-11 items-center gap-1 text-foreground underline-offset-4 hover:underline sm:min-h-0"
          >
            {t("colophon")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
          </Link>
        </li>
      </ul>
    </section>
  );
}
