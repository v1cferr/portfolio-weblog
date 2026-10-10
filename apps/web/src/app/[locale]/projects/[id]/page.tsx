import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Button } from "@workspace/ui/components/button";
import { localize, localizeList } from "@workspace/content";
import { ExternalLinkIcon, FolderGit2Icon, InfoIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PartialDate } from "@/components/date-range";
import { FallbackNotice } from "@/components/fallback-notice";
import { MediaGallery } from "@/components/media-gallery";
import { RelatedContent } from "@/components/related-content";
import { SourceLink } from "@/components/source-link";
import { TechList } from "@/components/tech-list";
import { ProjectStateBadge } from "@/features/projects/project-state-badge";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { getRepoIndex } from "@/lib/github";
import { pageAlternates } from "@/lib/i18n";

// Same period as GITHUB_REVALIDATE_SECONDS; Next requires a literal here.
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getContent()
    .getProjects()
    .map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const project = getContent().getProject(id);
  if (project === undefined) return {};
  return {
    title: project.title,
    description: localize(project.summary, locale).value,
    alternates: pageAlternates(locale, `/projects/${id}`),
  };
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}

export default async function ProjectPage({ params }: PageProps<"/[locale]/projects/[id]">) {
  const { id } = await params;
  const locale = await getLocale();
  const [t, common, nav] = await Promise.all([getTranslations("Projects"), getTranslations("Common"), getTranslations("Nav")]);
  const content = getContent();
  const project = content.getProject(id);
  if (project === undefined) notFound();

  const summary = localize(project.summary, locale);
  const problem = project.problem && localize(project.problem, locale);
  const description = project.description && localize(project.description, locale);
  const learnings = localizeList(project.learnings, locale);
  const fallback = [summary, problem, description, learnings].find((text) => text?.isFallback === true);

  // GitHub is enrichment only. A repository is linked only if GitHub lists it
  // as public right now; if GitHub is unreachable, the page says so.
  const index = project.repository !== undefined ? await getRepoIndex() : undefined;
  const repo = index?.ok === true && project.repository !== undefined ? index.get(project.repository) : undefined;

  return (
    <article>
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/projects">{nav("projects")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="max-w-3xl">
          <header className="mb-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ProjectStateBadge state={project.state} label={t(`state.${project.state}`)} />
              <span className="font-mono text-xs text-muted-foreground">{t(`category.${project.category}`)}</span>
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{project.title}</h1>
            <p className="text-xl text-pretty" lang={summary.locale}>
              {summary.value}
            </p>
            <SourceLink file={content.getSourceFile(id)} />
          </header>

          {fallback !== undefined && <FallbackNotice requested={locale} actual={fallback.locale} />}

          <div className="mb-10">
            <MediaGallery media={project.media} placeholder={project.mediaPlaceholder} />
          </div>

          <div className="space-y-10">
            {problem && (
              <section className="space-y-3">
                <h2 className="font-display text-xl font-semibold">{t("problem")}</h2>
                <p lang={problem.locale}>{problem.value}</p>
              </section>
            )}
            {description && (
              <p className="font-serif text-lg leading-relaxed" lang={description.locale}>
                {description.value}
              </p>
            )}
            {learnings && (
              <section className="space-y-3">
                <h2 className="font-display text-xl font-semibold">{t("learnings")}</h2>
                <ul className="list-disc space-y-1.5 pl-5 marker:text-lane-project" lang={learnings.locale}>
                  {learnings.value.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
            {project.technologies.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-xl font-semibold">{common("technologies")}</h2>
                <TechList ids={project.technologies} label={common("technologies")} />
              </section>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <dl className="divide-y border-y">
            {project.startedAt !== undefined && (
              <Fact label={t("started")}>
                <PartialDate date={project.startedAt} />
              </Fact>
            )}
            {project.endedAt !== undefined && (
              <Fact label={t("ended")}>
                <PartialDate date={project.endedAt} />
              </Fact>
            )}
            {repo !== undefined && (
              <>
                {repo.language !== null && <Fact label={t("language")}>{repo.language}</Fact>}
                <Fact label={t("repositoryCreated")}>
                  <PartialDate date={repo.created_at.slice(0, 10)} />
                </Fact>
                {repo.pushed_at !== null && (
                  <Fact label={t("lastPush")}>
                    <PartialDate date={repo.pushed_at.slice(0, 10)} />
                  </Fact>
                )}
              </>
            )}
            {project.collaborators.length > 0 && (
              <Fact label={t("collaborators")}>{project.collaborators.map((person) => person.name).join(", ")}</Fact>
            )}
          </dl>

          {index?.ok === false && (
            <Alert>
              <InfoIcon />
              <AlertDescription>{t("githubUnavailable")}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {repo !== undefined && (
              <Button asChild variant="outline" className="justify-start">
                <a href={repo.html_url}>
                  <FolderGit2Icon /> {t("repository")}
                </a>
              </Button>
            )}
            {project.links.map((link) => (
              <Button key={link.url} asChild variant="ghost" className="justify-start">
                <a href={link.url}>
                  <ExternalLinkIcon /> {link.label}
                </a>
              </Button>
            ))}
          </div>
        </aside>
      </div>

      <RelatedContent id={id} />
    </article>
  );
}
