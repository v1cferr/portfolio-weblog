import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@workspace/ui/components/card";
import type { ProjectCategory, ProjectState } from "@workspace/content";

import { Link } from "@/i18n/navigation";

import { ProjectStateBadge } from "./project-state-badge";

/** Everything a card shows, already localized; serializable for the client catalogue. */
export interface ProjectCardData {
  id: string;
  title: string;
  summary: string;
  summaryLocale: string;
  state: ProjectState;
  stateLabel: string;
  category: ProjectCategory;
  categoryLabel: string;
  featured: boolean;
  technologies: { id: string; name: string }[];
}

/** Presentational card, usable from server and client components alike. */
export function ProjectCardView({ project, techLimit = 4 }: { project: ProjectCardData; techLimit?: number }) {
  return (
    <Card className="relative h-full gap-3 py-5 transition-colors hover:border-lane-project/50">
      <CardHeader className="gap-2 px-5">
        <div className="flex items-center gap-2">
          <ProjectStateBadge state={project.state} label={project.stateLabel} />
          <span className="font-mono text-[0.7rem] text-muted-foreground">{project.categoryLabel}</span>
        </div>
        <h3 className="font-display text-lg leading-snug font-semibold">
          <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {project.title}
          </Link>
        </h3>
      </CardHeader>
      <CardContent className="flex-1 px-5">
        <p className="line-clamp-3 text-sm text-pretty text-muted-foreground" lang={project.summaryLocale}>
          {project.summary}
        </p>
      </CardContent>
      {project.technologies.length > 0 && (
        <CardFooter className="relative z-10 px-5">
          <ul className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, techLimit).map((tech) => (
              <li key={tech.id}>
                <Badge variant="outline" asChild className="font-normal">
                  <Link href={{ pathname: "/projects", query: { tech: tech.id } }}>{tech.name}</Link>
                </Badge>
              </li>
            ))}
          </ul>
        </CardFooter>
      )}
    </Card>
  );
}
