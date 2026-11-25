"use client";

import { Button } from "@workspace/ui/components/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@workspace/ui/components/item";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, SearchXIcon, SparklesIcon, XIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useLocale, useTranslations } from "next-intl";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { useId, useSyncExternalStore } from "react";

import { NAV_FORWARD } from "@/components/page-transition";

import { TechnologyIcon } from "@/components/icon";
import { EmptyState } from "@/components/empty-state";
import { Morph } from "@/components/morph";
import { RevealItem, RevealList } from "@/components/motion/reveal";
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

interface Filters {
  state: string;
  category: string;
  tech: string;
}

interface CatalogProps {
  projects: ProjectCardData[];
  states: Option[];
  categories: Option[];
  technologies: Option[];
}

/** The value of "All" in a facet: no parameter in the URL. */
const ALL = "all";

const matches = (project: ProjectCardData, { state, category, tech }: Filters) =>
  (state === "" || project.state === state) &&
  (category === "" || project.category === category) &&
  (tech === "" || project.technologies.some((item) => item.id === tech));

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

/**
 * The catalogue with its filters in the URL (?state=&category=&tech=), so a
 * filtered view can be linked. Filtering is instant, on the client.
 *
 * The query is read straight from the location, not with useSearchParams:
 * that hook makes a static page render only a Suspense fallback, which the
 * real catalogue then replaces, losing a click or the focus made meanwhile.
 * Here the server and the first client render are the unfiltered catalogue
 * (every entry in the static HTML), hydrated in place, and the filters apply
 * right after. Writes use history.replaceState, which Next keeps in sync.
 */
export function ProjectCatalog(props: CatalogProps) {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => ""
  );
  const params = new URLSearchParams(search);
  const filters: Filters = { state: params.get("state") ?? "", category: params.get("category") ?? "", tech: params.get("tech") ?? "" };
  const write = (next: URLSearchParams) => {
    const query = next.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query === "" ? "" : `?${query}`}`);
    window.dispatchEvent(new Event(QUERY_CHANGED));
  };
  return (
    <ProjectCatalogView
      {...props}
      filters={filters}
      onChange={(key, value) => {
        const next = new URLSearchParams(search);
        if (value === "") next.delete(key);
        else next.set(key, value);
        write(next);
      }}
      onClear={() => {
        write(new URLSearchParams());
      }}
    />
  );
}

/**
 * Filterable catalogue: the featured projects up top (unfiltered view only),
 * then every project on a newest-first timeline grouped by year, like every
 * dated list on the site. Pure: it renders from `filters`.
 *
 * Status is a segmented control and Type a row of chips (chosen 2026-11-25,
 * option A): one choice per facet, a count on every option against the other
 * facet, options with no match dimmed. Year groups are built after filtering,
 * so a year with no match disappears with its heading.
 */
export function ProjectCatalogView({
  projects,
  states,
  categories,
  technologies,
  filters,
  onChange,
  onClear,
}: CatalogProps & {
  filters: Filters;
  onChange?: (key: keyof Filters, value: string) => void;
  onClear?: () => void;
}) {
  const t = useTranslations("Projects");
  const locale = useLocale();
  const { state, category, tech } = filters;
  const techName = technologies.find((option) => option.value === tech)?.label;

  const filtered = state !== "" || category !== "" || tech !== "";
  const featured = projects.filter((project) => project.featured);
  const visible = projects.filter((project) => matches(project, filters));
  const years = new Map<string, ProjectCardData[]>();
  for (const project of newestFirst(visible, (item) => ({ start: item.date, end: item.date }))) {
    const year = project.date?.slice(0, 4) ?? "";
    years.set(year, [...(years.get(year) ?? []), project]);
  }
  // How many an option would show, given the other facets.
  const countFor = (key: keyof Filters, value: string) =>
    projects.filter((project) => matches(project, { ...filters, [key]: value === ALL ? "" : value })).length;

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

      <div className="flex flex-col gap-4" data-testid="project-filters">
        <Segmented
          label={t("filterState")}
          value={state === "" ? ALL : state}
          options={[{ value: ALL, label: t("all") }, ...states].map((option) => ({ ...option, count: countFor("state", option.value) }))}
          onChange={(value) => onChange?.("state", value === ALL ? "" : value)}
        />
        <Chips
          label={t("filterCategory")}
          legend={t("labelCategory")}
          value={category === "" ? ALL : category}
          options={[{ value: ALL, label: t("all") }, ...categories].map((option) => ({
            ...option,
            count: countFor("category", option.value),
          }))}
          onChange={(value) => onChange?.("category", value === ALL ? "" : value)}
        />
        <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <p role="status" className="font-medium text-foreground tabular-nums" data-testid="project-count">
            {t("count", { count: visible.length })}
          </p>
          {techName !== undefined && (
            <button
              type="button"
              onClick={() => onChange?.("tech", "")}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-foreground ring-1 ring-primary/25 hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {t("technology", { name: techName })}
              <XIcon aria-hidden className="size-3.5" />
              <span className="sr-only">{t("clear")}</span>
            </button>
          )}
          {filtered && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <XIcon /> {t("clear")}
            </Button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={SearchXIcon} title={t("empty")}>
          <Button variant="outline" size="sm" onClick={onClear}>
            <XIcon /> {t("clear")}
          </Button>
        </EmptyState>
      ) : (
        <section aria-labelledby="all-projects">
          <h2 id="all-projects" className="sr-only">
            {t("allProjects")}
          </h2>
          {/* Groups come and go with the filters: no reveal-on-scroll here, an entry that
              arrives after its list was revealed would stay invisible. */}
          <AnimatePresence initial={false} mode="popLayout">
            {[...years].map(([year, items]) => (
              <m.section
                key={year || "undated"}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                aria-label={year || t("undated")}
                className="pb-2"
              >
                <YearHeading as="h3" year={year || t("undated")} count={items.length} label={year || t("undated")} />
                <RailTimeline
                  lane="project"
                  dynamic
                  nodeClassName="top-5"
                  gapClassName="space-y-3"
                  entries={items.map((project) => ({
                    key: project.id,
                    node: project.date === undefined || project.dateFromRepository ? "undated" : "past",
                    children: (
                      <ProjectRow
                        project={project}
                        date={project.date && formatDayMonth(project.date, locale)}
                        // A featured project already morphs from its card above.
                        morph={filtered || !project.featured}
                      />
                    ),
                  }))}
                />
              </m.section>
            ))}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}

interface CountedOption extends Option {
  count: number;
}

/** Ignores a choice with nothing behind it, and Radix's empty value (a click on the selected item): one is always chosen. */
function choose(options: CountedOption[], current: string, next: string, onChange: (value: string) => void) {
  if (next === "" || next === current) return;
  if (options.find((option) => option.value === next)?.count === 0) return;
  onChange(next);
}

/**
 * Status: a segmented control. One radio group (Radix: roving focus, arrow
 * keys), the selection a filled pill that slides to the chosen segment.
 */
function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: CountedOption[];
  onChange: (value: string) => void;
}) {
  const pill = useId();
  return (
    // Scrolls inside itself on narrow phones instead of widening the page.
    <div className="-mx-1 max-w-full overflow-x-auto px-1 py-0.5">
      <ToggleGroupPrimitive.Root
        type="single"
        value={value}
        onValueChange={(next) => {
          choose(options, value, next, onChange);
        }}
        aria-label={label}
        // Full width on phones, the segments sharing it equally; content width from sm up.
        className="flex w-full items-center gap-1 rounded-full border bg-muted/60 p-1 sm:inline-flex sm:w-auto"
      >
        {options.map((option) => {
          const active = option.value === value;
          const empty = option.count === 0 && !active;
          return (
            <ToggleGroupPrimitive.Item
              key={option.value}
              value={option.value}
              aria-disabled={empty || undefined}
              className={cn(
                "relative inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[0.8rem] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:px-3.5 sm:text-sm",
                active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                empty && "cursor-not-allowed opacity-40 hover:text-muted-foreground"
              )}
            >
              {active && (
                <m.span
                  layoutId={pill}
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-border"
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                />
              )}
              <span className="relative">{option.label}</span>
              {/* Phones keep the four labels on one line; the counts come back from sm up. */}
              <span className="relative hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline">{option.count}</span>
            </ToggleGroupPrimitive.Item>
          );
        })}
      </ToggleGroupPrimitive.Root>
    </div>
  );
}

/** Type: a quieter row of chips, the chosen one tinted and checked. */
function Chips({
  label,
  legend,
  value,
  options,
  onChange,
}: {
  label: string;
  legend: string;
  value: string;
  options: CountedOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span aria-hidden className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {legend}
      </span>
      <ToggleGroupPrimitive.Root
        type="single"
        value={value}
        onValueChange={(next) => {
          choose(options, value, next, onChange);
        }}
        aria-label={label}
        className="flex flex-wrap items-center gap-1.5"
      >
        {options.map((option) => {
          const active = option.value === value;
          const empty = option.count === 0 && !active;
          return (
            <ToggleGroupPrimitive.Item
              key={option.value}
              value={option.value}
              aria-disabled={empty || undefined}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary/10 font-medium text-foreground ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                empty && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground"
              )}
            >
              {active && <CheckIcon aria-hidden className="size-3.5" />}
              {option.label}
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{option.count}</span>
            </ToggleGroupPrimitive.Item>
          );
        })}
      </ToggleGroupPrimitive.Root>
    </div>
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
