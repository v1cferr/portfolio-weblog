import { Card, CardContent, CardFooter, CardHeader } from "@workspace/ui/components/card";
import { localize, type Project } from "@workspace/content";
import { getLocale, getTranslations } from "next-intl/server";

import { TechList } from "@/components/tech-list";
import { Link } from "@/i18n/navigation";

import { ProjectStateBadge } from "./project-state-badge";

export async function ProjectCard({ project }: { project: Project }) {
  const [locale, t, common] = await Promise.all([getLocale(), getTranslations("Projects"), getTranslations("Common")]);
  const summary = localize(project.summary, locale);
  return (
    <Card className="relative h-full gap-3 py-5 transition-colors hover:border-lane-project/50">
      <CardHeader className="gap-2 px-5">
        <div className="flex items-center gap-2">
          <ProjectStateBadge state={project.state} label={t(`state.${project.state}`)} />
          <span className="font-mono text-[0.7rem] text-muted-foreground">{t(`category.${project.category}`)}</span>
        </div>
        <h3 className="font-display text-lg leading-snug font-semibold">
          <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {project.title}
          </Link>
        </h3>
      </CardHeader>
      <CardContent className="flex-1 px-5">
        <p className="line-clamp-3 text-sm text-pretty text-muted-foreground" lang={summary.locale}>
          {summary.value}
        </p>
      </CardContent>
      <CardFooter className="relative z-10 px-5">
        <TechList ids={project.technologies.slice(0, 4)} label={common("technologies")} />
      </CardFooter>
    </Card>
  );
}
