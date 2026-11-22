import { localize } from "@workspace/content";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { renderOgImage } from "@/lib/og-image";
import { storePath } from "@/lib/store-path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Project by Victor Ferreira on v1cferr.dev";

export const dynamicParams = false;

// A route handler sits outside the [locale] layout, so it lists the locale too.
export function generateStaticParams() {
  const ids = getContent()
    .getProjects()
    .map((project) => project.id);
  return routing.locales.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

/** A project's share card: title, summary and its main technologies. */
export default async function ProjectImage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: requested, id } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const content = getContent();
  const project = content.getProject(id);
  if (project === undefined) notFound();
  const kind = await getTranslations({ locale, namespace: "Kind" });
  const technologies = project.technologies
    .slice(0, 4)
    .map((tech) => content.getTechnology(tech)?.name ?? tech)
    .join(" · ");
  return renderOgImage({
    storePath: storePath(`projects/${id}.yaml`).label,
    title: project.title,
    subtitle: localize(project.summary, locale).value,
    meta: technologies === "" ? undefined : technologies,
    section: kind("project"),
    lane: "project",
    command: `open /projects/${id}`,
  });
}
