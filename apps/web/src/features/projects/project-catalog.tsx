"use client";

import type * as React from "react";
import { Button } from "@workspace/ui/components/button";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group";
import { SparklesIcon, XIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";

import { TechnologyIcon } from "@/components/icon";
import { RevealItem, RevealList } from "@/components/motion/reveal";
import { RailTimeline } from "@/components/rail-timeline";
import { Link } from "@/i18n/navigation";
import { formatDayMonth, newestFirst } from "@/lib/dates";

import { type ProjectCardData, ProjectCardView } from "./project-card-view";
import { ProjectStateBadge } from "./project-state-badge";

interface Option {
  value: string;
  label: string;
}

/**
 * Filterable catalogue: the featured projects up top (unfiltered view only),
 * then every project on a newest-first timeline grouped by year, like every
 * dated list on the site. Filters live in the URL (?state=&category=&tech=) so
 * a filtered view can be linked; every entry is in the static HTML.
 */
export function ProjectCatalog({
  projects,
  states,
  categories,
  technologies,
}: {
  projects: ProjectCardData[];
  states: Option[];
  categories: Option[];
  technologies: Option[];
}) {
  const t = useTranslations("Projects");
  const locale = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const state = params.get("state") ?? "";
  const category = params.get("category") ?? "";
  const tech = params.get("tech") ?? "";
  const techName = technologies.find((option) => option.value === tech)?.label;

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "") next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(query === "" ? pathname : `${pathname}?${query}`, { scroll: false });
  }

  const filtered = state !== "" || category !== "" || tech !== "";
  const featured = projects.filter((project) => project.featured);
  const visible = projects.filter(
    (project) =>
      (state === "" || project.state === state) &&
      (category === "" || project.category === category) &&
      (tech === "" || project.technologies.some((item) => item.id === tech))
  );
  const years = new Map<string, ProjectCardData[]>();
  for (const project of newestFirst(visible, (item) => ({ start: item.date, end: item.date }))) {
    const year = project.date?.slice(0, 4) ?? "";
    years.set(year, [...(years.get(year) ?? []), project]);
  }

  return (
    <div className="space-y-8">
      {!filtered && featured.length > 0 && (
        <section aria-labelledby="featured-projects" className="space-y-3">
          <h2 id="featured-projects" className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            <SparklesIcon aria-hidden className="size-3.5 text-brand" />
            {t("featured")}
          </h2>
          <RevealList className="grid gap-4 md:grid-cols-3">
            {featured.map((project) => (
              <RevealItem key={project.id}>
                <ProjectCardView project={project} />
              </RevealItem>
            ))}
          </RevealList>
        </section>
      )}

      <div className="glass flex flex-col gap-3 rounded-xl border p-3 sm:p-4">
        <FilterRow label={t("labelState")}>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={state}
            onValueChange={(value) => {
              update("state", value);
            }}
            aria-label={t("filterState")}
            className="flex-wrap"
          >
            {states.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>
        <FilterRow label={t("labelCategory")}>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={category}
            onValueChange={(value) => {
              update("category", value);
            }}
            aria-label={t("filterCategory")}
            className="flex-wrap"
          >
            {categories.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FilterRow>
        <div className="flex min-h-8 flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <p aria-live="polite">{t("count", { count: visible.length })}</p>
          {techName !== undefined && <p className="font-medium text-foreground">{t("technology", { name: techName })}</p>}
          {(state !== "" || category !== "" || tech !== "") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.replace(pathname, { scroll: false });
              }}
            >
              <XIcon /> {t("clear")}
            </Button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <section aria-labelledby="all-projects">
          <h2 id="all-projects" className="sr-only">
            {t("allProjects")}
          </h2>
          {[...years].map(([year, items]) => (
            <section key={year || "undated"} aria-label={year || t("undated")} className="pb-2">
              <h3 className="glass sticky top-17 z-10 my-3 w-fit rounded-full border px-3 py-1 font-mono text-sm font-medium tabular-nums">
                {year || t("undated")}
                <span aria-hidden className="text-muted-foreground">
                  {" · "}
                  {items.length}
                </span>
              </h3>
              <RailTimeline
                lane="project"
                nodeClassName="top-5"
                gapClassName="space-y-3"
                entries={items.map((project) => ({
                  key: project.id,
                  node: project.date === undefined || project.dateFromRepository ? "undated" : "past",
                  children: <ProjectRow project={project} date={project.date && formatDayMonth(project.date, locale)} />,
                }))}
              />
            </section>
          ))}
        </section>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <span aria-hidden className="w-16 shrink-0 font-mono text-xs text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

/** One project on the timeline: name, status and summary, with its stack and date. */
function ProjectRow({ project, date }: { project: ProjectCardData; date?: string | undefined }) {
  return (
    <article className="glass relative flex flex-col gap-2 rounded-xl border px-4 py-3 transition-colors hover:border-lane-project/50 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display font-semibold">
            <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {project.title}
            </Link>
          </h4>
          <ProjectStateBadge state={project.state} label={project.stateLabel} />
          <span className="font-mono text-[0.7rem] text-muted-foreground">{project.categoryLabel}</span>
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground" lang={project.summaryLocale}>
          {project.summary}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ul className="flex items-center gap-1.5">
          {project.technologies.slice(0, 4).map((tech) => (
            <li key={tech.id} title={tech.name}>
              <TechnologyIcon icon={tech.icon} category={tech.category} className="size-4" />
              <span className="sr-only">{tech.name}</span>
            </li>
          ))}
        </ul>
        {date !== undefined && date !== "" && (
          <time dateTime={project.date} className="w-14 text-right font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {date}
          </time>
        )}
      </div>
    </article>
  );
}
