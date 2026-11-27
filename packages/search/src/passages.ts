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
    const heading = inFence ? undefined : atxHeading(line);
    if (heading !== undefined) sections.push({ heading, source: [] });
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

const MONTHS = {
  "en-us": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  "pt-br": ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
} as const;

/** The corpus is English or Portuguese; zh-cn falls back to English. */
type PassageLanguage = keyof typeof MONTHS;

function language(locale: Locale): PassageLanguage {
  return locale === "pt-br" ? "pt-br" : "en-us";
}

/**
 * A partial date ("2026", "2026-08", "2026-08-15") in words: "agosto de 2026",
 * "August 2026". The model reads passages and writes answers from them, so
 * dates in words come back as natural sentences instead of "2026-08 – present"
 * ranges pasted from a field (ADR 0011).
 */
export function dateInWords(date: string, lang: PassageLanguage): string {
  const [year = date, month, day] = date.split("-");
  const name = month === undefined ? undefined : MONTHS[lang][Number(month) - 1];
  if (name === undefined) return year;
  if (day === undefined) return lang === "pt-br" ? `${name} de ${year}` : `${name} ${year}`;
  return lang === "pt-br" ? `${String(Number(day))} de ${name} de ${year}` : `${name} ${String(Number(day))}, ${year}`;
}

/** "since August 2026" or "from March 2026 to July 2026"; empty without a start. */
function period(start: string | undefined, end: string | undefined, lang: PassageLanguage): string {
  if (start === undefined) return "";
  const from = dateInWords(start, lang);
  if (end === undefined) return lang === "pt-br" ? `desde ${from}` : `since ${from}`;
  const to = dateInWords(end, lang);
  return lang === "pt-br" ? `de ${from} a ${to}` : `from ${from} to ${to}`;
}

/** A current role as a first-person sentence: "Trabalho como X em Y desde agosto de 2026." */
function currentRole(title: string, org: string, selfEmployed: boolean, since: string, lang: PassageLanguage): string {
  const when = since === "" ? "" : ` ${since}`;
  if (lang === "pt-br")
    return selfEmployed ? `Trabalho como ${title} por conta própria (${org})${when}.` : `Trabalho como ${title} em ${org}${when}.`;
  return selfEmployed ? `I have worked as ${title} on my own (${org})${when}.` : `I have worked as ${title} at ${org}${when}.`;
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
  const lang = language(locale);

  const profile = content.getProfile();
  const headline = localize(profile.headline, locale);
  const current = content
    .getExperiences()
    .filter((experience) => experience.positions.at(-1)?.end === undefined)
    .map((experience) => {
      const position = experience.positions.at(-1);
      const title = position ? localize(position.title, locale).value : "";
      const organization = content.getOrganization(experience.organization);
      const org = organization?.name ?? experience.organization;
      return currentRole(title, org, organization?.kind === "self-employed", period(position?.start, undefined, lang), lang);
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
      current.join(" "),
      profile.location && (lang === "pt-br" ? `Moro em ${profile.location}.` : `I'm based in ${profile.location}.`),
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
      const positions = experience?.positions.map((position) => {
        const when = period(position.start, position.end, lang);
        return `${localize(position.title, locale).value}${when === "" ? "" : `, ${when}`}.`;
      });
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

/**
 * The text of an ATX heading of level 1 to 3 ("## Title", optionally closed
 * with "##"), or undefined. Parsed by hand instead of one regex: a pattern like
 * /^#{1,3}\s+(.+?)\s*#*\s*$/ backtracks polynomially on long runs of spaces
 * (CodeQL js/polynomial-redos), and post bodies are library input.
 */
export function atxHeading(line: string): string | undefined {
  let level = 0;
  while (level < line.length && line[level] === "#") level++;
  if (level < 1 || level > 3) return undefined;
  const next = line[level];
  if (next !== " " && next !== "\t") return undefined;
  let text = line.slice(level).trim();
  // An optional closing sequence of '#' counts only after whitespace.
  let end = text.length;
  while (end > 0 && text[end - 1] === "#") end--;
  if (end < text.length && (end === 0 || text[end - 1] === " " || text[end - 1] === "\t")) text = text.slice(0, end).trimEnd();
  return text === "" ? undefined : text;
}
