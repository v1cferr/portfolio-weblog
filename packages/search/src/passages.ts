import { type ContentRegistry, type Locale, localize, localizeList } from "@workspace/content";

import { buildSearchDocuments, mdxToText } from "./documents";
import type { SearchEntityType } from "./options";

/**
 * One citable piece of a public page, for the profile chat's retrieval
 * (ADR 0011). Short entities are one passage; posts are split by heading.
 * Every passage keeps the document it came from and the page that shows it.
 */
export interface Passage {
  /** Unique per locale: the document id, plus `#n` for the chunks of a post. */
  id: string;
  /** The SearchDocument id this passage belongs to (`${type}:${entityId}:${locale}`). */
  docId: string;
  entityId: string;
  type: SearchEntityType | "profile";
  /** Locale the text is written in (may differ from the requested one on fallback). */
  locale: string;
  /** Page title, with the section heading for post chunks. */
  title: string;
  /** Technology names, tags and organization names. */
  keywords: string;
  /** Plain text, one paragraph per line. */
  text: string;
  /** Locale-prefixed path of the page that shows this passage. */
  url: string;
}

/** Longest passage, in characters; longer sections are split at paragraph breaks. */
const MAX_PASSAGE = 1200;

function lines(...parts: (string | readonly string[] | undefined)[]): string {
  return parts
    .flat()
    .filter((part): part is string => part !== undefined && part.trim() !== "")
    .join("\n");
}

/** Groups paragraphs into pieces of at most `max` characters (a longer paragraph stays whole). */
export function splitParagraphs(text: string, max = MAX_PASSAGE): string[] {
  const pieces: string[] = [];
  let current = "";
  for (const paragraph of text.split("\n").filter((line) => line.trim() !== "")) {
    if (current !== "" && current.length + paragraph.length + 1 > max) {
      pieces.push(current);
      current = "";
    }
    current = current === "" ? paragraph : `${current}\n${paragraph}`;
  }
  if (current !== "") pieces.push(current);
  return pieces;
}

/**
 * Splits an MDX body at its headings (levels 1 to 3), outside code fences.
 * Returns the heading (empty before the first one) and that section's text,
 * one paragraph per line.
 */
export function splitByHeading(body: string): { heading: string; text: string }[] {
  const sections: { heading: string; source: string[] }[] = [{ heading: "", source: [] }];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith("```")) inFence = !inFence;
    const heading = inFence ? null : /^#{1,3}\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading?.[1] !== undefined) sections.push({ heading: heading[1], source: [] });
    else sections.at(-1)?.source.push(line);
  }
  return sections
    .map(({ heading, source }) => ({
      heading,
      // Blank lines separate paragraphs; mdxToText flattens each one.
      text: source
        .join("\n")
        .split(/\n\s*\n/)
        .map(mdxToText)
        .filter((paragraph) => paragraph !== "")
        .join("\n"),
    }))
    .filter((section) => section.text !== "");
}

/** The few labels the About passage needs; the corpus is English or Portuguese (zh-cn falls back to English). */
const LABELS = {
  "en-us": { current: "Current role", location: "Location", present: "present" },
  "pt-br": { current: "Cargo atual", location: "Localização", present: "atual" },
} as const;

function labels(locale: Locale) {
  return locale === "pt-br" ? LABELS["pt-br"] : LABELS["en-us"];
}

function period(start: string | undefined, end: string | undefined, present: string): string {
  return `${start ?? "?"} – ${end ?? present}`;
}

/**
 * Retrieval passages for everything a visitor of `locale` can see: the same
 * public documents as the search index (technologies left out, they have no
 * prose), the About page, and posts split by heading. Takes the public
 * registry, so drafts and private entities cannot get in.
 */
export function buildRetrievalPassages(content: ContentRegistry, locale: Locale): Passage[] {
  const passages: Passage[] = [];
  const prefix = `/${locale}`;
  const label = labels(locale);

  const profile = content.getProfile();
  const headline = localize(profile.headline, locale);
  const current = content
    .getExperiences()
    .filter((experience) => experience.positions.at(-1)?.end === undefined)
    .map((experience) => {
      const position = experience.positions.at(-1);
      const title = position ? localize(position.title, locale).value : "";
      const org = content.getOrganization(experience.organization)?.name ?? experience.organization;
      return `${title} · ${org} (${period(position?.start, undefined, label.present)})`;
    });
  passages.push({
    id: `profile:${profile.id}:${locale}`,
    docId: `profile:${profile.id}:${locale}`,
    entityId: profile.id,
    type: "profile",
    locale: headline.locale,
    title: `${profile.name} · ${headline.value}`,
    keywords: lines(
      profile.aliases,
      profile.handle,
      profile.location,
      profile.specialties,
      profile.stack.map((entry) => entry.label)
    ),
    text: lines(
      `${profile.name} (${profile.handle}): ${headline.value}.`,
      current.length > 0 ? `${label.current}: ${current.join("; ")}.` : undefined,
      profile.location && `${label.location}: ${profile.location}.`,
      localize(profile.summary, locale).value,
      localizeList(profile.about, locale)?.value,
      localizeList(profile.focus, locale)?.value,
      localizeList(profile.motivation, locale)?.value,
      localizeList(profile.principles, locale)?.value,
      localizeList(profile.studying, locale)?.value
    ),
    url: `${prefix}/about`,
  });

  for (const doc of buildSearchDocuments(content, locale)) {
    if (doc.type === "technology") continue;
    if (doc.type === "post") {
      const post = content.getPost(doc.entityId, locale);
      const sections = post ? splitByHeading(post.body) : [];
      const chunks = [
        { heading: "", text: post?.frontmatter.summary ?? doc.excerpt },
        ...sections.flatMap((section) => splitParagraphs(section.text).map((text) => ({ heading: section.heading, text }))),
      ];
      chunks.forEach((chunk, n) => {
        passages.push({
          id: `${doc.id}#${String(n)}`,
          docId: doc.id,
          entityId: doc.entityId,
          type: "post",
          locale: doc.locale,
          title: chunk.heading === "" ? doc.title : `${doc.title} › ${chunk.heading}`,
          keywords: doc.keywords,
          text: chunk.text,
          url: doc.url,
        });
      });
      continue;
    }
    let text = doc.text;
    if (doc.type === "experience") {
      const experience = content.getExperience(doc.entityId);
      const positions = experience?.positions.map(
        (position) => `${localize(position.title, locale).value}: ${period(position.start, position.end, label.present)}`
      );
      text = lines(positions, doc.text);
    }
    splitParagraphs(text).forEach((piece, n) => {
      passages.push({
        id: n === 0 ? doc.id : `${doc.id}#${String(n)}`,
        docId: doc.id,
        entityId: doc.entityId,
        type: doc.type,
        locale: doc.locale,
        title: doc.title,
        keywords: doc.keywords,
        text: piece,
        url: doc.url,
      });
    });
  }

  return passages;
}
