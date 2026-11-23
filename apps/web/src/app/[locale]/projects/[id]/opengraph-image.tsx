import { localize } from "@workspace/content";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getContent } from "@/lib/content";
import { ogImageAlt, ogImageMetadata, ogLocale, renderOgImage } from "@/lib/og-image";
import { storePath } from "@/lib/store-path";

export async function generateImageMetadata({ params }: { params: { locale: string; id: string } }) {
  const project = getContent().getProject(params.id);
  if (project === undefined) return [];
  return ogImageMetadata(await ogImageAlt(ogLocale(params.locale), project.title));
}

/** A project's share card: title, summary and its main technologies. */
export default async function ProjectImage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: requested, id } = await params;
  const locale = ogLocale(requested);
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
