import type { PartialDate } from "./schemas";

/** Earliest day a partial date can mean: "2023" → "2023-01-01". */
export function lowerBound(date: PartialDate): string {
  const [y, m = "01", d = "01"] = date.split("-");
  return `${y ?? ""}-${m}-${d}`;
}

/** Latest day a partial date can mean: "2023-02" → "2023-02-28". */
export function upperBound(date: PartialDate): string {
  const parts = date.split("-");
  const y = Number(parts[0]);
  if (parts.length === 1) return `${parts[0] ?? ""}-12-31`;
  const m = Number(parts[1]);
  if (parts.length === 2) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return `${parts[0] ?? ""}-${parts[1] ?? ""}-${String(last).padStart(2, "0")}`;
  }
  return date;
}

/** True when `end` can not be before `start`, given each one's precision. */
export function isOrdered(start: PartialDate, end: PartialDate): boolean {
  return upperBound(end) >= lowerBound(start);
}

/** Sort key, newest first, that keeps less precise dates before more precise ones in the same period. */
export function compareDesc(a: PartialDate, b: PartialDate): number {
  return lowerBound(b).localeCompare(lowerBound(a));
}
