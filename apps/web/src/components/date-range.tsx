import { getLocale, getTranslations } from "next-intl/server";

import { currentMonth, formatPartialDate, monthsBetween } from "@/lib/dates";

/** "Jul 2023 – Dec 2023 · 6 mos". Precision follows the content: no invented days. */
export async function DateRange({ start, end, showDuration = false }: { start: string; end?: string | undefined; showDuration?: boolean }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Common")]);
  const months = showDuration ? monthsBetween(start, end ?? currentMonth()) : undefined;
  let duration: string | undefined;
  if (months !== undefined && months > 0) {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    duration = [years > 0 ? t("years", { count: years }) : undefined, rest > 0 ? t("months", { count: rest }) : undefined]
      .filter(Boolean)
      .join(" ");
  }
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      <time dateTime={start}>{formatPartialDate(start, locale)}</time>
      {" – "}
      {end === undefined ? t("present") : <time dateTime={end}>{formatPartialDate(end, locale)}</time>}
      {duration !== undefined && duration !== "" && <span> · {duration}</span>}
    </span>
  );
}

export async function PartialDate({ date }: { date: string }) {
  const locale = await getLocale();
  return (
    <time dateTime={date} className="font-mono text-xs text-muted-foreground tabular-nums">
      {formatPartialDate(date, locale)}
    </time>
  );
}
