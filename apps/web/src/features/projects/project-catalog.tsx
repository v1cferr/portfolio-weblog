"use client";

import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@workspace/ui/components/item";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowRightIcon, SearchXIcon, XIcon } from "lucide-react";
import * as m from "motion/react-m";
import { useLocale, useTranslations } from "next-intl";
import { Tabs } from "radix-ui";
import { type ReactNode, useEffect, useId, useRef, useSyncExternalStore } from "react";

import { EmptyState } from "@/components/empty-state";
import { TechnologyIcon } from "@/components/icon";
import { Morph } from "@/components/morph";
import { NAV_FORWARD } from "@/components/page-transition";
import { RailTimeline } from "@/components/rail-timeline";
import { YearHeading } from "@/components/year-heading";
import { Link } from "@/i18n/navigation";
import { formatDayMonth, newestFirst } from "@/lib/dates";

import { type ProjectCardData, ProjectCardView } from "./project-card-view";
import { ProjectStateBadge } from "./project-state-badge";

interface Option {
  value: string;
  label: string;
}

interface CatalogProps {
  projects: ProjectCardData[];
  technologies: Option[];
}

/**
 * The tabs, one choice each (chosen 2026-11-25): no facets to combine, a
 * count per tab that never changes. Featured is the default, with no
 * parameter in the URL.
 */
const VIEWS = {
  featured: (project: ProjectCardData) => project.featured,
  all: () => true,
  active: (project: ProjectCardData) => project.state === "active",
  experimental: (project: ProjectCardData) => project.state === "experimental",
  professional: (project: ProjectCardData) => project.category === "professional",
  study: (project: ProjectCardData) => project.category === "study",
  challenge: (project: ProjectCardData) => project.category === "challenge",
} as const;
type View = keyof typeof VIEWS;
const isView = (value: string | null): value is View => value !== null && Object.hasOwn(VIEWS, value);

/** Old filter links (?state=, ?category=) land on the closest tab. */
function legacyView(params: URLSearchParams): View | undefined {
  const category = params.get("category");
  if (category === "study" || category === "challenge") return category;
  const state = params.get("state");
  if (state === "active" || state === "experimental") return state;
  if (state !== null || category !== null) return "all";
  return undefined;
}

/** Fired after the catalogue rewrites the query, so the store below re-reads it (replaceState fires no event). */
const QUERY_CHANGED = "projects:query";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(QUERY_CHANGED, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(QUERY_CHANGED, onChange);
  };
}

function writeQuery(params: URLSearchParams) {
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query === "" ? "" : `?${query}`}`);
  window.dispatchEvent(new Event(QUERY_CHANGED));
}

/**
 * The projects as tabs (?view=…), plus ?tech= from technology links, which
 * narrows the All tab.
 *
 * The query is read straight from the location, not with useSearchParams:
 * that hook makes a static page render only a Suspense fallback, which the
 * real catalogue then replaces, losing a click or the focus made meanwhile.
 * Here the server and the first client render are the Featured tab with every
 * panel in the HTML, hydrated in place; the URL's tab applies right after.
 * Writes use history.replaceState, which Next keeps in sync.
 */
export function ProjectCatalog({ projects, technologies }: CatalogProps) {
  const t = useTranslations("Projects");
  const locale = useLocale();
  const pill = useId();
  const list = useRef<HTMLDivElement>(null);
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => ""
  );
  const params = new URLSearchParams(search);
  const tech = params.get("tech") ?? "";
  const techName = technologies.find((option) => option.value === tech)?.label;
  const requested = params.get("view");
  const view: View = isView(requested) ? requested : tech !== "" ? "all" : (legacyView(params) ?? "featured");

  // Old filter links become ?view= links once, so a copied URL is the new kind.
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    const legacy = legacyView(current);
    if (legacy === undefined) return;
    current.delete("state");
    current.delete("category");
    if (!current.has("view") && legacy !== "featured") current.set("view", legacy);
    writeQuery(current);
  }, []);

  // On a phone the tab row scrolls: keep the chosen tab in sight.
  useEffect(() => {
    list.current?.querySelector<HTMLElement>('[data-state="active"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [view]);

  const choose = (next: string) => {
    if (!isView(next)) return;
    const query = new URLSearchParams(window.location.search);
    if (next === "featured") query.delete("view");
    else query.set("view", next);
    if (next !== "all") query.delete("tech");
    writeQuery(query);
  };
  const clearTech = () => {
    const query = new URLSearchParams(window.location.search);
    query.delete("tech");
    writeQuery(query);
  };

  const views = (Object.keys(VIEWS) as View[])
    .map((key) => ({ key, count: projects.filter(VIEWS[key]).length }))
    .filter(({ key, count }) => key === "featured" || key === "all" || count > 0);

  return (
    <Tabs.Root value={view} onValueChange={choose} activationMode="automatic" className="space-y-8">
      {/* Nothing above the tabs ever changes height, so they never move under the pointer. */}
      <div ref={list} className="-mx-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tabs.List aria-label={t("tabsLabel")} className="inline-flex snap-x items-center gap-1 rounded-full border bg-muted/60 p-1">
          {views.map(({ key, count }) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className={cn(
                "relative inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                key === view ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {key === view && (
                <m.span
                  layoutId={pill}
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-border"
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                />
              )}
              <span className="relative">{t(`tabs.${key}`)}</span>
              {key !== "featured" && <span className="relative font-mono text-xs text-muted-foreground tabular-nums">{count}</span>}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </div>

      {views.map(({ key, count }) => {
        const shown = projects.filter(
          (project) => VIEWS[key](project) && (key !== "all" || tech === "" || project.technologies.some((item) => item.id === tech))
        );
        return (
          <Tabs.Content
            key={key}
            value={key}
            forceMount
            // Every panel stays in the HTML; the inactive ones are hidden. Switching only fades the new one in.
            className="outline-none data-[state=active]:motion-safe:animate-in data-[state=active]:motion-safe:fade-in-0 data-[state=active]:motion-safe:duration-150 data-[state=inactive]:hidden"
          >
            {key === "featured" ? (
              <div className="space-y-4">
                <ul className="grid gap-4 md:grid-cols-3">
                  {shown.map((project) => (
                    <li key={project.id}>
                      <ProjectCardView project={project} />
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    choose("all");
                  }}
                  className="group/link inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("showAll", { count: projects.length })}
                  <ArrowRightIcon aria-hidden className="icon-fwd size-3.5" />
                </button>
              </div>
            ) : (
              <Timeline
                projects={shown}
                locale={locale}
                label={t(`tabs.${key}`)}
                headerless={count === shown.length}
                count={t("count", { count: shown.length })}
                chip={
                  key === "all" && techName !== undefined ? (
                    <button
                      type="button"
                      onClick={clearTech}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-sm text-foreground ring-1 ring-primary/25 hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {t("technology", { name: techName })}
                      <XIcon aria-hidden className="size-3.5" />
                      <span className="sr-only">{t("clear")}</span>
                    </button>
                  ) : undefined
                }
                empty={t("empty")}
              />
            )}
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
}

/** A tab's projects on a newest-first timeline grouped by year. */
function Timeline({
  projects,
  locale,
  label,
  headerless,
  count,
  chip,
  empty,
}: {
  projects: ProjectCardData[];
  locale: string;
  label: string;
  /** The tab already says how many: no count line unless a technology narrows it. */
  headerless: boolean;
  count: string;
  chip: ReactNode;
  empty: string;
}) {
  const years = new Map<string, ProjectCardData[]>();
  for (const project of newestFirst(projects, (item) => ({ start: item.date, end: item.date }))) {
    const year = project.date?.slice(0, 4) ?? "";
    years.set(year, [...(years.get(year) ?? []), project]);
  }
  return (
    <section aria-label={label} className="space-y-4">
      {(!headerless || chip !== undefined) && (
        <div className="flex min-h-9 flex-wrap items-center gap-3 text-sm">
          {chip}
          <p role="status" className="text-muted-foreground tabular-nums" data-testid="project-count">
            {count}
          </p>
        </div>
      )}
      {projects.length === 0 ? (
        <EmptyState icon={SearchXIcon} title={empty} />
      ) : (
        [...years].map(([year, items]) => (
          <section key={year || "undated"} aria-label={year || "—"} className="pb-2">
            <YearHeading as="h3" year={year || "—"} count={items.length} label={year || "—"} />
            <RailTimeline
              lane="project"
              dynamic
              nodeClassName="top-5"
              gapClassName="space-y-3"
              entries={items.map((project) => ({
                key: project.id,
                node: project.date === undefined || project.dateFromRepository ? "undated" : "past",
                children: (
                  <ProjectRow project={project} date={project.date && formatDayMonth(project.date, locale)} morph={!project.featured} />
                ),
              }))}
            />
          </section>
        ))
      )}
    </section>
  );
}

/** One project on the timeline: name, status and summary, with its stack and date. */
function ProjectRow({ project, date, morph }: { project: ProjectCardData; date?: string | undefined; morph: boolean }) {
  return (
    <Item variant="glass" asChild className="glass-hover relative">
      <article>
        {/* Phones give the summary the full width (two lines) and wrap the stack and date below it;
            from sm up they sit beside it, as before. */}
        <ItemContent className="min-w-0 max-sm:basis-full">
          <ItemTitle className="flex-wrap text-base">
            <Morph kind="project" id={project.id} enabled={morph}>
              <h4>
                <Link
                  href={`/projects/${project.id}`}
                  transitionTypes={NAV_FORWARD}
                  className="after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {project.title}
                </Link>
              </h4>
            </Morph>
            <ProjectStateBadge state={project.state} label={project.stateLabel} />
            <span className="font-mono text-[0.7rem] font-normal text-muted-foreground">{project.categoryLabel}</span>
          </ItemTitle>
          <ItemDescription className="line-clamp-2 sm:line-clamp-1" lang={project.summaryLocale}>
            {project.summary}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="relative z-10 gap-3 max-sm:w-full max-sm:justify-between">
          <ul className="flex items-center gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <li key={tech.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <TechnologyIcon icon={tech.icon} category={tech.category} className="size-4" />
                      <span className="sr-only">{tech.name}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{tech.name}</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
          {date !== undefined && date !== "" && (
            <time
              dateTime={project.date}
              className="w-14 text-right font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums"
            >
              {date}
            </time>
          )}
        </ItemActions>
      </article>
    </Item>
  );
}
