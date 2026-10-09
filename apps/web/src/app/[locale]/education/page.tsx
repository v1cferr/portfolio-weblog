import { localize } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { DateRange, PartialDate } from "@/components/date-range";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { SourceLink } from "@/components/source-link";
import { TechList } from "@/components/tech-list";
import { OrganizationMark } from "@/features/career/organization-mark";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { pageAlternates } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Education");
  return { title: t("title"), description: t("description"), alternates: pageAlternates(locale, "/education") };
}

export default async function EducationPage() {
  const locale = await getLocale();
  const [t, common] = await Promise.all([getTranslations("Education"), getTranslations("Common")]);
  const content = getContent();
  const education = content.getEducation();
  const certifications = content.getCertifications();

  return (
    <>
      <PageHeader eyebrow="content/education" title={t("title")} description={t("description")} />

      {education.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {education.map((item) => {
            const institution = content.getOrganization(item.institution);
            const title = localize(item.title, locale);
            return (
              <li key={item.id} id={item.id} className="scroll-mt-24">
                <Card className="h-full gap-4 py-5">
                  <CardHeader className="flex flex-row items-start gap-3 px-5">
                    {institution !== undefined && <OrganizationMark organization={institution} />}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[0.7rem] tracking-wide text-lane-study uppercase">{t(`kind.${item.kind}`)}</span>
                        {item.state !== undefined && (
                          <Badge variant="outline" className="font-normal">
                            {t(`state.${item.state}`)}
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-display text-xl leading-tight font-semibold" lang={title.locale}>
                        {title.value}
                      </h2>
                      {institution !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          {institution.url !== undefined ? (
                            <a href={institution.url} className="inline-flex items-center gap-1 hover:text-foreground">
                              {institution.name} <ExternalLinkIcon className="size-3" aria-hidden />
                            </a>
                          ) : (
                            institution.name
                          )}
                        </p>
                      )}
                      {item.start !== undefined ? (
                        <DateRange start={item.start} end={item.end} />
                      ) : (
                        <p className="font-mono text-xs text-muted-foreground">{t("noDates")}</p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5">
                    {item.summary !== undefined && <p className="text-muted-foreground">{localize(item.summary, locale).value}</p>}
                    {item.projects.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">{t("projects")}</h3>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          {item.projects.map((id) => {
                            const project = content.getProject(id);
                            return (
                              project && (
                                <li key={id}>
                                  <Link
                                    href={`/projects/${id}`}
                                    className="font-mono underline-offset-4 hover:text-lane-project hover:underline"
                                  >
                                    {project.title}
                                  </Link>
                                </li>
                              )
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    <TechList ids={item.technologies} label={common("technologies")} />
                    <SourceLink file={content.getSourceFile(item.id)} />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <section aria-labelledby="certifications-heading" id="certifications" className="mt-16 scroll-mt-24">
        <SectionHeading id="certifications-heading">{t("certifications")}</SectionHeading>
        {certifications.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t("certificationsEmpty")}</p>
        ) : (
          <ul className="divide-y border-y">
            {certifications.map((cert) => (
              <li key={cert.id} id={cert.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-medium">{cert.name}</span>
                <span className="flex items-center gap-3 text-sm text-muted-foreground">
                  {content.getOrganization(cert.issuer)?.name}
                  <PartialDate date={cert.issuedAt} />
                  {cert.credentialUrl !== undefined && (
                    <a href={cert.credentialUrl} className="inline-flex items-center gap-1 hover:text-foreground">
                      {t("credential")} <ExternalLinkIcon className="size-3" aria-hidden />
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
