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
