import { languageTag } from "./i18n";

/**
 * Formats a partial date with exactly the precision it has: "2023" stays a
 * year, "2023-07" becomes "Jul 2023", a full date gets its day.
 */
export function formatPartialDate(date: string, locale: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (y === undefined || Number.isNaN(y)) return date;
  if (m === undefined) return String(y);
  const value = new Date(Date.UTC(y, m - 1, d ?? 1));
  const options: Intl.DateTimeFormatOptions =
    d === undefined
      ? { year: "numeric", month: "short", timeZone: "UTC" }
      : { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat(languageTag(locale), options).format(value);
}

/** Whole months between two month-precision dates, inclusive of both ends; undefined when either is year-only. */
export function monthsBetween(start: string, end: string): number | undefined {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  if (sy === undefined || sm === undefined || ey === undefined || em === undefined) return undefined;
  return (ey - sy) * 12 + (em - sm) + 1;
}

/** "YYYY-MM" of today, for durations of current positions. */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * The years a span covers, compact: "2021–22", "2024–26", "2023" when it
 * starts and ends in the same year, "2026–" while it is still open.
 */
export function formatYearSpan(start: string, end?: string): string {
  const from = start.slice(0, 4);
  if (end === undefined) return `${from}–`;
  const to = end.slice(0, 4);
  if (to === from) return from;
  return `${from}–${to.slice(0, 2) === from.slice(0, 2) ? to.slice(2) : to}`;
}

/**
 * Day and month without the year, for lists already grouped by year:
 * "09 out", "Oct 09", "10月09日"; "out" / "Oct" for a month-precision date and
 * "" for a year-only one.
 */
export function formatDayMonth(date: string, locale: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (y === undefined || m === undefined || Number.isNaN(m)) return "";
  const tag = languageTag(locale);
  const value = new Date(Date.UTC(y, m - 1, d ?? 1));
  const options: Intl.DateTimeFormatOptions =
    d === undefined ? { month: "short", timeZone: "UTC" } : { day: "2-digit", month: "short", timeZone: "UTC" };
  const format = new Intl.DateTimeFormat(tag, options);
  if (tag.startsWith("zh")) return format.format(value);
  return format
    .formatToParts(value)
    .filter((part) => part.type === "day" || part.type === "month")
    .map((part) => part.value.replace(/\.$/, ""))
    .join(" ");
}

/**
 * A compact month range: "jul – ago 2026" within one year, "set 2024 – jul
 * 2025" across years, "ago 2026 – {present}" while open.
 */
export function formatMonthRange(start: string, end: string | undefined, locale: string, present: string): string {
  const label = (date: string) => [formatDayMonth(date.slice(0, 7), locale), date.slice(0, 4)].filter(Boolean).join(" ");
  if (end === undefined) return `${label(start)} – ${present}`;
  if (start.slice(0, 4) === end.slice(0, 4)) {
    const from = formatDayMonth(start.slice(0, 7), locale);
    return from === "" ? start.slice(0, 4) : `${from} – ${label(end)}`;
  }
  return `${label(start)} – ${label(end)}`;
}

/**
 * Reverse chronological order for anything with optional dates: ongoing
 * entries first, then by their latest date, newest first; entries with no
 * dates at all go last, in their original order.
 */
export function newestFirst<T>(items: readonly T[], dates: (item: T) => { start?: string | undefined; end?: string | undefined }): T[] {
  const rank = (item: T) => {
    const { start, end } = dates(item);
    if (start === undefined && end === undefined) return { group: 2, key: "" };
    if (end === undefined) return { group: 0, key: start ?? "" };
    return { group: 1, key: end };
  };
  return items
    .map((item, index) => ({ item, index, ...rank(item) }))
    .sort((a, b) => a.group - b.group || b.key.localeCompare(a.key) || a.index - b.index)
    .map(({ item }) => item);
}
