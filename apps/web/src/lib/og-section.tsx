import "server-only";

import { getTranslations } from "next-intl/server";

import { ogImageAlt, ogImageMetadata, ogLocale, renderOgImage, type OgLane } from "./og-image";
import { storePath } from "./store-path";

/*
 * Share cards of the section pages (/projects, /career, /weblog...): the
 * section's title and description from the messages, the same store path the
 * page header shows, and the section's lane. Each route file under
 * app/[locale]/<section>/opengraph-image.tsx is a thin wrapper around these.
 */

type SectionNamespace = "About" | "Career" | "Education" | "Next" | "Now" | "Projects" | "Setup" | "Timeline" | "Weblog";

export interface OgSection {
  /** Messages namespace with the section's `title` and `description`. */
  namespace: SectionNamespace;
  /** Path of the section, after the locale. */
  path: string;
  /** Content the page is built from, as its PageHeader `source`. */
  source: { path: string; name?: string };
  /** The section's lane; undefined for the pages that span all four. */
  lane?: OgLane;
}

/** generateImageMetadata of a section card: its localized alt text. */
export async function sectionImageMetadata(requested: string, { namespace }: OgSection) {
  const locale = ogLocale(requested);
  const t = await getTranslations({ locale, namespace });
  return ogImageMetadata(await ogImageAlt(locale, t("title")));
}

/** The section card: title, description and the shell prompt listing the section. */
export async function renderSectionImage(requested: string, { namespace, path, source, lane }: OgSection) {
  const locale = ogLocale(requested);
  const t = await getTranslations({ locale, namespace });
  return renderOgImage({
    storePath: storePath(source.path, source.name).label,
    title: t("title"),
    subtitle: t("description"),
    lane,
    command: `ls ${path}`,
  });
}
