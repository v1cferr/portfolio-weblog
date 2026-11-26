import { type Document, isMap, parseDocument } from "yaml";

/*
 * The pure half of `pnpm linkedin:import` (scripts/linkedin-import.ts):
 * reading Recommendations_Received.csv from a LinkedIn data export and
 * merging it into content/recommendations/<id>.yaml. Only the fields LinkedIn
 * owns are written; everything the owner wrote stays as it is, comments and
 * formatting included.
 */

/** The export's header, exactly; anything else means LinkedIn changed the format. */
export const RECOMMENDATIONS_HEADER = ["First Name", "Last Name", "Company", "Job Title", "Text", "Creation Date", "Status"] as const;

export const RECOMMENDATIONS_CSV = "Recommendations_Received.csv";

/** The owner's timezone: the export's times are UTC, while LinkedIn's page shows the local date. Brazil has no DST since 2019. */
const UTC_OFFSET_HOURS = -3;

export interface LinkedInRecommendation {
  id: string;
  name: string;
  company: string | undefined;
  jobTitle: string;
  /** Paragraphs, verbatim. */
  text: string[];
  /** YYYY-MM-DD in the owner's timezone. */
  date: string;
  visibility: "public" | "private";
}

/** RFC 4180: quoted fields may hold commas, doubled quotes and line breaks. A BOM and CRLF are tolerated. */
export function parseCsv(source: string): string[][] {
  const text = source.startsWith("﻿") ? source.slice(1) : source;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((each) => each.some((cell) => cell !== ""));
}

/** "Júlio César Raveli" → "julio-cesar-raveli": the file name and id of the entry. */
export function slugOf(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "05/21/25, 12:15 AM" (UTC) → "2025-05-20" (the owner's date). */
export function linkedinDate(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{2}), (\d{1,2}):(\d{2}) ([AP]M)$/.exec(value.trim());
  if (match === null) throw new Error(`unexpected date "${value}" (expected MM/DD/YY, hh:mm AM)`);
  const [, month, day, year, hour, minute, half] = match.map(String);
  const hours = (Number(hour) % 12) + (half === "PM" ? 12 : 0);
  const utc = Date.UTC(2000 + Number(year), Number(month) - 1, Number(day), hours, Number(minute));
  return new Date(utc + UTC_OFFSET_HOURS * 3_600_000).toISOString().slice(0, 10);
}

/**
 * The export flattens line breaks: paragraphs (and the lines of a sign-off)
 * come joined by two or more spaces. Each becomes one entry, trimmed.
 */
export function paragraphs(text: string): string[] {
  return text
    .split(/\s*\n\s*|\s{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}

/** Reads the CSV; throws when the header is not the one this importer knows. */
export function readRecommendations(csv: string): LinkedInRecommendation[] {
  const [header, ...rows] = parseCsv(csv);
  if (header?.join(",") !== RECOMMENDATIONS_HEADER.join(",")) {
    throw new Error(`unexpected header in ${RECOMMENDATIONS_CSV}: ${header?.join(",") ?? "(empty)"}`);
  }
  return rows.map((cells) => {
    const [first = "", last = "", company = "", jobTitle = "", text = "", created = "", status = ""] = cells.map((cell) => cell.trim());
    const name = `${first} ${last}`.trim();
    if (status !== "VISIBLE" && status !== "HIDDEN") throw new Error(`${name}: unexpected status "${status}"`);
    return {
      id: slugOf(name),
      name,
      company: company === "" ? undefined : company,
      jobTitle,
      text: paragraphs(text),
      date: linkedinDate(created),
      visibility: status === "VISIBLE" ? "public" : "private",
    };
  });
}

export type ImportChange = "added" | "updated" | "unchanged";

export interface ImportDefaults {
  /** The owner's recommendations page, for new entries. */
  url: string;
  /** The language new texts are taken to be in. */
  language: string;
}

const TODO = [
  " Imported by pnpm linkedin:import. TODO (owner): set relation (kind, label, organization,",
  " experience or education), an excerpt, the en-us translation and, when ready, status: published.",
].join("\n");

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Merges one exported recommendation into its YAML file (`source`, undefined
 * when there is none yet). Synced fields are set only when they differ, so an
 * unchanged entry is written back byte for byte. When the original text
 * changes, translations are flagged with `translationStale: true`.
 */
export function mergeRecommendation(
  source: string | undefined,
  item: LinkedInRecommendation,
  defaults: ImportDefaults
): { yaml: string; change: ImportChange } {
  if (source === undefined) {
    const doc = parseDocument("{}");
    doc.contents = doc.createNode({
      id: item.id,
      status: "draft",
      visibility: item.visibility,
      name: item.name,
      jobTitle: item.jobTitle,
      ...(item.company !== undefined && { company: item.company }),
      date: item.date,
      language: defaults.language,
      url: defaults.url,
      text: { [defaults.language]: item.text },
    });
    doc.commentBefore = TODO;
    return { yaml: doc.toString({ lineWidth: 100 }), change: "added" };
  }

  const doc: Document = parseDocument(source);
  if (!isMap(doc.contents)) throw new Error(`${item.id}.yaml is not a mapping`);
  const current = doc.toJS() as Record<string, unknown> & { language?: string; text?: Record<string, unknown> };
  const language = current.language ?? defaults.language;
  let changed = false;
  const sync = (key: string, value: unknown) => {
    if (same(current[key], value)) return;
    if (value === undefined) doc.delete(key);
    else doc.set(key, value);
    changed = true;
  };
  sync("name", item.name);
  sync("jobTitle", item.jobTitle);
  sync("company", item.company);
  sync("date", item.date);
  // Visibility defaults to public, so an entry without the key is already public.
  if ((current.visibility ?? "public") !== item.visibility) sync("visibility", item.visibility);
  if (!same(current.text?.[language], item.text)) {
    doc.setIn(["text", language], doc.createNode(item.text));
    const translated = Object.keys(current.text ?? {}).some((locale) => locale !== language);
    if (translated) doc.set("translationStale", true);
    changed = true;
  }
  return changed ? { yaml: doc.toString({ lineWidth: 100 }), change: "updated" } : { yaml: source, change: "unchanged" };
}
