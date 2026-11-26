import { type Education, localize, STUDY_GROUPS } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { AwardIcon, BookOpenIcon, ExternalLinkIcon, GraduationCapIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { CopyLink } from "@/components/anchor/copy-link";
import { PageTransition } from "@/components/page-transition";
import { DateRange, PartialDate } from "@/components/date-range";
import { EmptyState } from "@/components/empty-state";
import { ContentLinkIcon } from "@/components/icon";
import { MediaGallery } from "@/components/media-gallery";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { RailTimeline } from "@/components/rail-timeline";
import { SourceLink } from "@/components/source-link";
import { TechList } from "@/components/tech-list";
import { OrganizationMark } from "@/features/career/organization-mark";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { newestFirst } from "@/lib/dates";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { ExternalLink } from "@/components/external-link";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Education");
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/education"),
    openGraph: { type: "website", ...pageOpenGraph(locale, "/education") },
  };
}

/**
 * Studies, grouped the way a reader weighs them: degrees, then
 * certifications, then courses and programs; newest first in each group.
 * An empty group has no heading. The certifications' empty state is a note
 * for the owner, so it shows in development only.
 */
export default async function EducationPage() {
  const locale = await getLocale();
  const [t, common] = await Promise.all([getTranslations("Education"), getTranslations("Common")]);
  const content = getContent();
  // Newest on top, like every dated list on the site; undated entries last.
  const education = newestFirst(content.getEducation(), (item) => item);
  const certifications = newestFirst(content.getCertifications(), (cert) => ({ start: cert.issuedAt, end: cert.issuedAt }));
  const inGroup = (kinds: readonly Education["kind"][]) => education.filter((item) => kinds.includes(item.kind));
  const degrees = inGroup(STUDY_GROUPS.degrees);
  const courses = inGroup(STUDY_GROUPS.courses);
  const showCertifications = certifications.length > 0 || process.env.NODE_ENV !== "production";

  const studyCard = (item: Education) => {
    const institution = content.getOrganization(item.institution);
    const title = localize(item.title, locale);
    return (
      // The id is the anchor the home's learning strip, the About page and search link to (the rail item has none).
      <Card id={item.id} data-anchor="" variant="glass" className="group/anchor gap-4 py-5">
        <CardHeader className="flex flex-row items-start gap-3 px-5">
          {institution !== undefined && <OrganizationMark organization={institution} />}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[0.7rem] tracking-wide text-lane-study uppercase">{t(`kind.${item.kind}`)}</span>
              {item.state !== undefined && (
                <Badge variant="outline" className="font-normal">
                  {t(`state.${item.state}`)}
                </Badge>
              )}
            </div>
            <div className="flex items-start gap-1">
              <h3 id={`${item.id}-title`} className="text-xl leading-tight font-semibold" lang={title.locale}>
                {title.value}
              </h3>
              <CopyLink id={item.id} nameId={`${item.id}-title`} />
            </div>
            {institution !== undefined && (
              <p className="text-sm text-muted-foreground">
                {institution.url !== undefined ? (
                  <ExternalLink href={institution.url} className="group/link inline-flex items-center gap-1 hover:text-foreground">
                    {institution.name} <ExternalLinkIcon className="icon-out size-3" aria-hidden />
                  </ExternalLink>
                ) : (
                  institution.name
                )}
              </p>
            )}
            {item.start !== undefined ? (
              <DateRange start={item.start} end={item.end} compact />
            ) : (
              <p className="font-mono text-xs text-muted-foreground">{t("noDates")}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5">
          {item.summary !== undefined && <p className="text-muted-foreground">{localize(item.summary, locale).value}</p>}
          {item.projects.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t("projects")}</h4>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {item.projects.map((id) => {
                  const project = content.getProject(id);
                  return (
                    project && (
                      <li key={id}>
                        <Link href={`/projects/${id}`} className="font-mono underline-offset-4 hover:text-lane-project hover:underline">
                          {project.title}
                        </Link>
                      </li>
                    )
                  );
                })}
              </ul>
            </div>
          )}
          {item.milestones.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t("milestones")}</h4>
              <ol className="space-y-1.5 text-sm">
                {newestFirst(item.milestones, (milestone) => ({ start: milestone.date, end: milestone.date })).map((milestone) => {
                  // Stable, locale-free anchor: the entry plus the milestone's date.
                  const anchor = `${item.id}-${milestone.date}`;
                  const label = localize(milestone.title, locale);
                  return (
                    <li key={anchor} id={anchor} data-anchor="" className="group/anchor flex items-baseline gap-3">
                      <PartialDate date={milestone.date} />
                      <span className="min-w-0 flex-1">
                        <span id={`${anchor}-title`} lang={label.locale}>
                          {label.value}
                        </span>
                        {milestone.post !== undefined && (
                          <ExternalLink
                            href={milestone.post}
                            className="group/link ml-1.5 inline-flex items-center gap-1 align-middle text-muted-foreground hover:text-foreground"
                          >
                            <ContentLinkIcon link={{ kind: "article", icon: "dv:linkedin", url: milestone.post }} className="size-3.5" />
                            <span className="sr-only">{t("milestonePost")}</span>
                            <ExternalLinkIcon className="icon-out size-3" aria-hidden />
                          </ExternalLink>
                        )}
                        <CopyLink id={anchor} nameId={`${anchor}-title`} className="align-middle" />
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          <MediaGallery id={item.id} media={item.media} compact />
          <TechList ids={item.technologies} label={common("technologies")} />
          <SourceLink file={content.getSourceFile(item.id)} />
        </CardContent>
      </Card>
    );
  };

  const group = (id: string, icon: typeof GraduationCapIcon, heading: string, items: Education[]) =>
    items.length > 0 && (
      <section aria-labelledby={id} className="mb-16">
        <SectionHeading id={id} icon={icon}>
          {heading}
        </SectionHeading>
        <RailTimeline
          lane="study"
          label={heading}
          entries={items.map((item) => ({
            key: item.id,
            node: item.start === undefined ? "undated" : item.end === undefined ? "current" : "past",
            children: studyCard(item),
          }))}
        />
      </section>
    );

  return (
    <PageTransition>
      <PageHeader source={{ path: "education" }} icon={GraduationCapIcon} title={t("title")} description={t("description")} />

      {education.length === 0 && certifications.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}

      {group("degrees", GraduationCapIcon, t("degrees"), degrees)}

      {showCertifications && (
        <section aria-labelledby="certifications-heading" id="certifications" className="mb-16">
          <SectionHeading id="certifications-heading" icon={AwardIcon}>
            {t("certifications")}
          </SectionHeading>
          {certifications.length === 0 ? (
            <EmptyState icon={AwardIcon} title={t("certificationsEmpty")}>
              <p className="text-sm text-muted-foreground">{t("certificationsDraft")}</p>
            </EmptyState>
          ) : (
            <ul className="divide-y border-y">
              {certifications.map((cert) => {
                const issuer = content.getOrganization(cert.issuer);
                return (
                  <li
                    key={cert.id}
                    id={cert.id}
                    data-anchor=""
                    className="group/anchor flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between"
                  >
                    <span className="flex items-center gap-3 font-medium">
                      {issuer !== undefined && <OrganizationMark organization={issuer} size="sm" />}
                      {cert.name}
                      <CopyLink id={cert.id} name={cert.name} className="-ml-2" />
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:justify-end">
                      {issuer?.name}
                      <PartialDate date={cert.issuedAt} />
                      {cert.credentialUrl !== undefined && (
                        <ExternalLink
                          href={cert.credentialUrl}
                          className="group/link inline-flex min-h-11 items-center gap-1 hover:text-foreground sm:min-h-0"
                        >
                          {t("credential")} <span className="sr-only">{cert.name}</span>
                          <ExternalLinkIcon className="icon-out size-3" aria-hidden />
                        </ExternalLink>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {group("courses", BookOpenIcon, t("courses"), courses)}
    </PageTransition>
  );
}
