import { cn } from "@workspace/ui/lib/utils";
import { ArrowRightIcon, CompassIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { SpineBranch } from "@/components/git-spine";
import { SectionHeading } from "@/components/page-header";
import { NAV_SECTION } from "@/components/page-transition";
import { Link } from "@/i18n/navigation";
import { latestNow } from "@/lib/now";

import { NowList } from "./now-list";
import { NowStamp } from "./now-stamp";

/** The home card shows at most this many bullets; /now has them all. */
const MAX_ITEMS = 5;

/**
 * The home page's "Now": the newest update in a few bullets, the owner's
 * words first and then what the content says (role, active projects, latest
 * article). A stale log is drawn muted and says how old it is.
 */
export async function NowCard() {
  const locale = await getLocale();
  const now = latestNow(locale);
  if (now === undefined) return null;
  const [t, home] = await Promise.all([getTranslations("Now"), getTranslations("Home")]);
  const room = Math.max(1, MAX_ITEMS - now.derived.length);
  const items = [...now.written.slice(0, room), ...now.derived].slice(0, MAX_ITEMS);
  const stale = now.age.stale;

  return (
    <section aria-labelledby="now" className="mb-16 max-w-3xl">
      <SectionHeading
        id="now"
        icon={CompassIcon}
        branch={<SpineBranch lane="career" />}
        action={
          <Link
            href="/now"
            transitionTypes={NAV_SECTION}
            className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:min-h-0"
          >
            {t("fullLog")} <ArrowRightIcon className="size-3.5" aria-hidden />
          </Link>
        }
      >
        {home("now")}
      </SectionHeading>
      <div
        data-stale={stale || undefined}
        className={cn("space-y-4 rounded-2xl border p-5 sm:p-6", stale ? "border-dashed bg-transparent text-muted-foreground" : "glass")}
      >
        {now.note !== undefined && (
          <p className="text-lg text-pretty" lang={now.note.locale}>
            {now.note.value}
          </p>
        )}
        <NowList items={items} label={t("items")} />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t pt-3">
          <NowStamp date={now.entry.date} age={now.age} />
          <Link
            href="/next"
            className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:min-h-0"
          >
            {t("next")} <ArrowRightIcon className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
