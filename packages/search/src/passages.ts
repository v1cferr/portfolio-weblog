import { type ContentRegistry, type Experience, type Locale, localize, localizeList } from "@workspace/content";

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

/** Where a role is held: "na FAI·UFSCar" / "no Senac" (the organization's article), "at FAI·UFSCar". */
function atOrganization(org: string, article: "a" | "o", lang: PassageLanguage): string {
  if (lang === "pt-br") return `${article === "o" ? "no" : "na"} ${org}`;
  return `at ${org}`;
}

interface Role {
  title: string;
  /** The title in every language it is written in, to recognize it in a headline left in another language. */
  titles?: readonly string[];
  org: string;
  article: "a" | "o";
  selfEmployed: boolean;
  start: string | undefined;
  end: string | undefined;
}

/**
 * A role as a first-person sentence, in the tense it is in: a current role in
 * the present ("Trabalho como X na Y desde agosto de 2026."), a past one in
 * the past ("Fui X na Y de março de 2026 a julho de 2026."). The model writes
 * its answers from these, so the tense it reads is the tense it uses.
 */
export function roleSentence(role: Role, lang: PassageLanguage): string {
  const when = period(role.start, role.end, lang);
  const tail = when === "" ? "" : ` ${when}`;
  const where = role.selfEmployed
    ? lang === "pt-br"
      ? `por conta própria (${role.org})`
      : `on my own (${role.org})`
    : atOrganization(role.org, role.article, lang);
  if (role.end === undefined)
    return lang === "pt-br" ? `Trabalho como ${role.title} ${where}${tail}.` : `I have worked as ${role.title} ${where}${tail}.`;
  return lang === "pt-br" ? `Fui ${role.title} ${where}${tail}.` : `I was ${role.title} ${where}${tail}.`;
}

/** Same words, ignoring case, accents and spacing: "Analista de Sistemas de IA" twice is one role. */
function sameText(a: string, b: string): boolean {
  const norm = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
  return norm(a) === norm(b);
}

/**
 * The opening of the profile passage. When the headline is the title of a
 * current role (in any language: a headline left in English still names the
 * Portuguese role), the two are one sentence ("Sou Victor, Analista de Sistemas de
 * IA na FAI·UFSCar desde agosto de 2026."), so the model never reads, or
 * repeats, the same role twice; other current roles follow with "também".
 */
export function profileIntro(name: string, handle: string, headline: string, current: readonly Role[], lang: PassageLanguage): string[] {
  const merged = current.find(
    (role) => !role.selfEmployed && [role.title, ...(role.titles ?? [])].some((title) => sameText(title, headline))
  );
  const others = current.filter((role) => role !== merged);
  let intro: string;
  if (merged === undefined) intro = lang === "pt-br" ? `Sou ${name} (${handle}): ${headline}.` : `I'm ${name} (${handle}): ${headline}.`;
  else {
    const when = period(merged.start, undefined, lang);
    const where = atOrganization(merged.org, merged.article, lang);
    intro =
      lang === "pt-br"
        ? `Sou ${name} (${handle}), ${merged.title} ${where}${when === "" ? "" : ` ${when}`}.`
        : `I'm ${name} (${handle}), ${merged.title} ${where}${when === "" ? "" : ` ${when}`}.`;
  }
  const rest = others.map((role) => {
    const sentence = roleSentence(role, lang);
    // A second current role runs alongside the first: "Também trabalho como…", "I have also worked as…".
    if (merged === undefined) return sentence;
    return lang === "pt-br"
      ? sentence.replace(/^Trabalho como/, "Também trabalho como")
      : sentence.replace(/^I have worked as/, "I have also worked as");
  });
  return [intro, ...rest];
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
  const roleOf = (experience: Experience, position: Experience["positions"][number]): Role => {
    const organization = content.getOrganization(experience.organization);
    return {
      title: localize(position.title, locale).value,
      titles: Object.values(position.title).filter((title): title is string => typeof title === "string"),
      org: organization?.name ?? experience.organization,
      article: organization?.article ?? "a",
      selfEmployed: organization?.kind === "self-employed",
      start: position.start,
      end: position.end,
    };
  };
  const current = content.getExperiences().flatMap((experience) => {
    const position = experience.positions.at(-1);
    return position === undefined || position.end !== undefined ? [] : [roleOf(experience, position)];
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
      profileIntro(profile.name, profile.handle, headline.value, current, lang).join(" "),
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
      const positions = experience?.positions.map((position) => roleSentence(roleOf(experience, position), lang));
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
