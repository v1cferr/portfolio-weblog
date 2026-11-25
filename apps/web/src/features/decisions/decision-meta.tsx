import { Badge } from "@workspace/ui/components/badge";
import type { Decision } from "@workspace/content";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { decisionPath } from "@/lib/decision-links";
import { formatPartialDate } from "@/lib/dates";

/**
 * A record's number, status and date, then what supersedes it and how often
 * it was revised. Shared by the list and the record's page.
 */
export async function DecisionMeta({ decision }: { decision: Decision }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Decisions")]);
  const lastRevision = decision.revisions.at(-1);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-mono text-xs text-lane-project tabular-nums">{t("number", { number: decision.number })}</span>
        <Badge
          variant={decision.status === "accepted" && decision.supersededBy.length === 0 ? "now" : "secondary"}
          className="font-mono font-normal"
        >
          {t(`status.${decision.status}`)}
        </Badge>
        <time dateTime={decision.date} className="font-mono text-xs text-muted-foreground tabular-nums">
          {formatPartialDate(decision.date, locale)}
        </time>
      </div>
      {decision.supersededBy.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t(decision.partlySuperseded ? "partlySupersededBy" : "supersededBy")}{" "}
          {decision.supersededBy.map((number, index) => (
            <span key={number}>
              {index > 0 && ", "}
              <Link href={decisionPath(number)} className="font-mono text-foreground underline underline-offset-4">
                {number}
              </Link>
            </span>
          ))}
        </p>
      )}
      {lastRevision !== undefined && (
        <p className="font-mono text-xs text-muted-foreground">
          {t("revisions", { count: decision.revisions.length, date: formatPartialDate(lastRevision.date, locale) })}
        </p>
      )}
    </div>
  );
}
