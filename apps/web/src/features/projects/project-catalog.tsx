"use client";

import { Button } from "@workspace/ui/components/button";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group";
import { XIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";

import { type ProjectCardData, ProjectCardView } from "./project-card-view";

interface Option {
  value: string;
  label: string;
}

/**
 * Filterable catalogue. Filters live in the URL (?state=&category=&tech=) so
 * a filtered view can be linked; every card is in the static HTML.
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

  const visible = projects.filter(
    (project) =>
      (state === "" || project.state === state) &&
      (category === "" || project.category === category) &&
      (tech === "" || project.technologies.some((item) => item.id === tech))
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <li key={project.id}>
              <ProjectCardView project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
