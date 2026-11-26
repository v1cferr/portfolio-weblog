import { Badge } from "@workspace/ui/components/badge";
import { Card } from "@workspace/ui/components/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { ScrollTextIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
import type { ProjectCategory, ProjectState, TechnologyCategory } from "@workspace/content";

import { NAV_FORWARD } from "@/components/page-transition";
import { TechnologyIcon } from "@/components/icon";
import { Morph } from "@/components/morph";
import { Link } from "@/i18n/navigation";

import { LanguageBar, type LanguageSliceData } from "./languages";
import { ProjectStateBadge } from "./project-state-badge";

/** Everything a card shows, already localized; serializable for the client catalogue. */
export interface ProjectCardData {
  id: string;
  title: string;
  summary: string;
  summaryLocale: string;
  /** The card's one line; the summary stands in without it. */
  hook?: string | undefined;
  hookLocale?: string | undefined;
  /** Hard numbers from the content, shown under the hook. */
  proof?: string | undefined;
  proofLocale?: string | undefined;
  /** The project's first screenshot, when it has one. */
  cover?: { src: string; width: number; height: number } | undefined;
  /** Shortened Nix store path of the project's content file, for the drawn cover. */
  storePath: string;
  state: ProjectState;
  stateLabel: string;
  category: ProjectCategory;
  categoryLabel: string;
  featured: boolean;
  /** Set when the project has a case study: the badge's text. */
  caseStudyLabel?: string | undefined;
  /** When the work started: from the content, else the repository's creation date. */
  date?: string | undefined;
  dateFromRepository: boolean;
  /** The repository's languages as GitHub lists them, when it is public and has code. */
  languages?: LanguageSliceData[] | undefined;
  /** The language bar's accessible name ("Languages: TypeScript 92.5%, …"). */
  languagesLabel?: string | undefined;
  technologies: { id: string; name: string; icon?: string | undefined; category: (typeof TechnologyCategory.options)[number] }[];
}

/**
 * Presentational card, usable from server and client components alike: a
 * cover, the meta row, the title, one line and the stack as icons. The whole
 * card is one link (the title's, stretched over it); the icons sit above the
 * link so their tooltips still open.
 *
 * `eager` is for the first row on screen: its cover loads at once with high
 * priority, every other one lazily.
 */
export function ProjectCardView({
  project,
  techLimit = 4,
  eager = false,
}: {
  project: ProjectCardData;
  techLimit?: number;
  eager?: boolean;
}) {
  const t = useTranslations("Common");
  const shown = project.technologies.slice(0, techLimit);
  const rest = project.technologies.slice(techLimit);
  const line = project.hook ?? project.summary;
  return (
    <Card
      variant="glass"
      data-testid="project-card"
      className="glass-hover relative h-full gap-0 py-0 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring motion-safe:[@media(hover:hover)]:hover:-translate-y-0.5"
    >
      <div className="relative">
        <ProjectCover project={project} eager={eager} />
        {project.languages !== undefined && project.languages.length > 0 && (
          // A thin strip along the cover's bottom edge, GitHub's bar without labels.
          <LanguageBar
            languages={project.languages}
            label={project.languagesLabel}
            className="absolute inset-x-0 bottom-0 h-[3px] opacity-90"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <ProjectStateBadge state={project.state} label={project.stateLabel} />
          <span className="font-mono text-[0.7rem] text-muted-foreground">{project.categoryLabel}</span>
          {project.caseStudyLabel !== undefined && (
            <Badge variant="now" className="ml-auto h-5 gap-1 px-1.5 text-[0.7rem] font-medium">
              <ScrollTextIcon aria-hidden className="size-3" />
              {project.caseStudyLabel}
            </Badge>
          )}
        </div>
        <Morph kind="project" id={project.id}>
          <h3 className="w-fit text-lg leading-snug font-semibold text-balance">
            <Link
              href={`/projects/${project.id}`}
              transitionTypes={NAV_FORWARD}
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
            >
              {project.title}
            </Link>
          </h3>
        </Morph>
        <p
          data-testid="project-hook"
          className={cn("text-sm text-pretty text-muted-foreground", project.hook !== undefined ? "line-clamp-3" : "line-clamp-2")}
          lang={project.hook !== undefined ? project.hookLocale : project.summaryLocale}
        >
          {line}
        </p>
        {project.proof !== undefined && (
          // Each figure stays whole; a narrow card wraps between them, never inside one.
          <p data-testid="project-proof" className="font-mono text-xs text-primary" lang={project.proofLocale}>
            {project.proof.split(" · ").map((figure, index) => (
              <Fragment key={figure}>
                {index > 0 && <span className="text-muted-foreground">{"\u00a0· "}</span>}
                <span className="whitespace-nowrap">{figure}</span>
              </Fragment>
            ))}
          </p>
        )}
        {shown.length > 0 && (
          <ul aria-label={t("technologies")} className="relative z-10 mt-auto flex w-fit items-center gap-2.5 pt-2">
            {shown.map((tech) => (
              <li key={tech.id} className="flex">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span role="img" aria-label={tech.name} data-testid="project-tech" className="inline-flex">
                      <TechnologyIcon icon={tech.icon} category={tech.category} className="size-4" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{tech.name}</TooltipContent>
                </Tooltip>
              </li>
            ))}
            {rest.length > 0 && (
              <li className="flex">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="img"
                      aria-label={rest.map((tech) => tech.name).join(", ")}
                      className="font-mono text-xs text-muted-foreground tabular-nums"
                    >
                      +{rest.length}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{rest.map((tech) => tech.name).join(" · ")}</TooltipContent>
                </Tooltip>
              </li>
            )}
          </ul>
        )}
      </div>
    </Card>
  );
}

/**
 * 16:9, so the space is reserved before anything loads. A screenshot when the
 * project has one (decorative here: the project page shows it with its
 * description); otherwise a drawn cover in the site's own style, the dot grid,
 * the content's store path and a shell prompt, which costs no request.
 */
function ProjectCover({ project, eager }: { project: ProjectCardData; eager: boolean }) {
  if (project.cover !== undefined) {
    return (
      <div data-testid="project-cover" className="relative aspect-video overflow-hidden border-b bg-muted">
        <Image
          src={project.cover.src}
          alt=""
          fill
          // The card's real width: a third of the content column on desktops, half from sm, the phone's width below.
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          className="object-cover object-top motion-safe:transition-transform motion-safe:duration-300 [@media(hover:hover)]:group-hover/card:scale-[1.02]"
        />
      </div>
    );
  }
  return (
    <div
      data-testid="project-cover"
      aria-hidden
      className="relative flex aspect-video flex-col justify-between overflow-hidden border-b bg-muted/50 p-4 font-mono select-none"
    >
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(120%_90%_at_0%_0%,#000,transparent_80%)] [background-image:radial-gradient(color-mix(in_srgb,var(--foreground)_22%,transparent)_1px,transparent_1.4px),radial-gradient(color-mix(in_srgb,var(--foreground)_22%,transparent)_1px,transparent_1.4px)] [background-position:0_0,8px_13.86px] [background-size:16px_27.71px]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(70%_60%_at_100%_100%,var(--lane-project),transparent)]" />
      <p className="relative truncate text-[0.65rem] text-muted-foreground">{project.storePath}</p>
      <p className="relative line-clamp-2 font-sans text-2xl leading-tight tracking-tight font-semibold text-balance text-foreground/90">
        {project.title}
      </p>
      <p className="relative truncate text-[0.7rem]">
        <span className="text-lane-career">victor@hub</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-lane-project">~</span>
        <span className="text-muted-foreground">$ open /projects/{project.id}</span>
      </p>
    </div>
  );
}
