import { cn } from "@workspace/ui/lib/utils";
import { HourglassIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { formatPartialDate } from "@/lib/dates";

/**
 * "Updated 23 Nov 2026", or, once the log is stale, "Last updated 120 days
 * ago" with the date still in the <time> element for machines and tooltips.
 */
export async function NowStamp({
  date,
  age,
  namespace = "Now",
  className,
}: {
  date: string;
  age?: { days: number; stale: boolean } | undefined;
  namespace?: "Now" | "Next";
  className?: string;
}) {
  const [locale, t, now] = await Promise.all([getLocale(), getTranslations(namespace), getTranslations("Now")]);
  const formatted = formatPartialDate(date, locale);
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground tabular-nums", className)}>
      {age?.stale === true ? (
        <>
          <HourglassIcon aria-hidden className="size-3.5" />
          <span>
            {now("stale", { days: age.days })} · <time dateTime={date}>{formatted}</time>
          </span>
          <span className="font-sans">{now("staleHint")}</span>
        </>
      ) : (
        <time dateTime={date}>{t("updated", { date: formatted })}</time>
      )}
    </p>
  );
}
