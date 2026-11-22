import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { languageTag } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

const SECTIONS = ["", "/about", "/career", "/projects", "/timeline", "/education", "/weblog", "/setup"];

/** Every public page in every locale. Posts list only the locales they are written in. */
export default function sitemap(): MetadataRoute.Sitemap {
  const content = getContent();
  const everyLocale = (path: string): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(`/${routing.defaultLocale}${path}`),
    alternates: { languages: Object.fromEntries(routing.locales.map((locale) => [languageTag(locale), absoluteUrl(`/${locale}${path}`)])) },
  });

  const pages = [
    ...SECTIONS,
    ...content.getExperiences().map((experience) => `/career/${experience.id}`),
    ...content.getProjects().map((project) => `/projects/${project.id}`),
  ].map(everyLocale);

  const posts = content.getPostSlugs().flatMap((slug) => {
    const post = content.getPost(slug, routing.defaultLocale);
    if (post === undefined) return [];
    const languages = Object.fromEntries(
      post.availableLocales.map((locale) => [languageTag(locale), absoluteUrl(`/${locale}/weblog/${slug}`)])
    );
    return post.availableLocales.map((locale) => ({
      url: absoluteUrl(`/${locale}/weblog/${slug}`),
      ...((post.frontmatter.updatedAt ?? post.frontmatter.publishedAt)
        ? { lastModified: post.frontmatter.updatedAt ?? post.frontmatter.publishedAt }
        : {}),
      alternates: { languages },
    }));
  });

  return [...pages, ...posts];
}
