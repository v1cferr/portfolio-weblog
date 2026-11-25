import { type Education, localize, ongoingStudies, type Organization, selectCredentials } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowRightIcon, ArrowUpRightIcon, AwardIcon, BookOpenIcon, GraduationCapIcon, type LucideIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ExternalLink } from "@/components/external-link";
import { SpineBranch } from "@/components/git-spine";
import { SectionHeading } from "@/components/page-header";
import { NAV_SECTION } from "@/components/page-transition";
import { OrganizationMark } from "@/features/career/organization-mark";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";

interface Tile {
  key: string;
  href: string;
  /** Shown when the issuer has no logo. */
  icon: LucideIcon;
  organization?: Organization | undefined;
  kind: string;
  title: string;
  titleLocale?: string | undefined;
  date?: string | undefined;
  verify?: string | undefined;
  ongoing?: boolean;
}

const studyIcon = (item: Education): LucideIcon => (item.kind === "degree" ? GraduationCapIcon : BookOpenIcon);

/**
 * Two short home sections from the studies: "Studying now" (what is in
 * progress; absent when nothing is) and "Certificates" (up to three: featured
 * certifications, then the latest completed studies). Split on 2026-11-23 at
 * the owner's request: finished work is not "learning". No badge wall: each
 * tile carries its issuer's official logo (the owner's request, 2026-11-25:
 * it lends the credential credibility), a monochrome icon only when the
 * issuer has none, and a mono date. `onSpine: false` leaves out the
 * git-spine branch, for when the strip sits in a column away from the spine.
 */
export async function LearningStrip({ onSpine = true }: { onSpine?: boolean } = {}) {
  const [locale, t, education, kind] = await Promise.all([
    getLocale(),
    getTranslations("Home"),
    getTranslations("Education"),
    getTranslations("Kind"),
  ]);
  const content = getContent();
  const studies = content.getEducation();

  const studying: Tile[] = ongoingStudies(studies)
    .slice(0, 1)
    .map((item): Tile => {
      const title = localize(item.title, locale);
      return {
        key: item.id,
        href: `/education#${item.id}`,
        icon: studyIcon(item),
        kind: education(`kind.${item.kind}`),
        title: title.value,
        titleLocale: title.locale,
        organization: content.getOrganization(item.institution),
        date: item.start,
        ongoing: true,
      };
    });
  const credentials: Tile[] = selectCredentials({ education: studies, certifications: content.getCertifications() }).map(
    (credential): Tile => {
      if (credential.kind === "certification") {
        const cert = credential.certification;
        return {
          key: cert.id,
          href: `/education#${cert.id}`,
          icon: AwardIcon,
          kind: kind("certification"),
          title: cert.name,
          organization: content.getOrganization(cert.issuer),
          date: cert.issuedAt,
          verify: cert.credentialUrl,
        };
      }
      const item = credential.education;
      const title = localize(item.title, locale);
      return {
        key: item.id,
        href: `/education#${item.id}`,
        icon: studyIcon(item),
        kind: education(`kind.${item.kind}`),
        title: title.value,
        titleLocale: title.locale,
        organization: content.getOrganization(item.institution),
        date: item.end ?? item.start,
      };
    }
  );
  if (studying.length === 0 && credentials.length === 0) return null;

  const allStudies = (
    <Link
      href="/education"
      transitionTypes={NAV_SECTION}
      className="group/link inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:min-h-0"
    >
      {t("allStudies")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
    </Link>
  );
  // Beside the Now card on wide screens, a branch would cross it; the heading keeps its icon instead.
  const branch = onSpine ? <SpineBranch lane="study" /> : undefined;
  const tileList = (tiles: Tile[], label: string) => (
    <ul aria-label={label} className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
      {tiles.map((tile) => (
        <TileItem key={tile.key} tile={tile} locale={locale} ongoingLabel={t("ongoing")} verifyLabel={t("verify")} />
      ))}
    </ul>
  );

  return (
    <>
      {studying.length > 0 && (
        <section aria-labelledby="studying" className="mb-16 max-w-3xl">
          <SectionHeading id="studying" icon={BookOpenIcon} branch={branch} action={credentials.length === 0 ? allStudies : undefined}>
            {t("studyingNow")}
          </SectionHeading>
          {tileList(studying, t("studyingNow"))}
        </section>
      )}
      {credentials.length > 0 && (
        <section aria-labelledby="credentials" className="mb-16 max-w-3xl">
          <SectionHeading id="credentials" icon={AwardIcon} branch={branch} action={allStudies}>
            {t("certificates")}
          </SectionHeading>
          {tileList(credentials, t("credentialsLabel"))}
        </section>
      )}
    </>
  );
}

function TileItem({ tile, locale, ongoingLabel, verifyLabel }: { tile: Tile; locale: string; ongoingLabel: string; verifyLabel: string }) {
  return (
    <li className="glass group relative flex gap-3 rounded-xl border p-4">
      {tile.organization !== undefined ? (
        <OrganizationMark
          organization={tile.organization}
          size="sm"
          fallback={<tile.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}
        />
      ) : (
        <tile.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.7rem] tracking-wide text-lane-study uppercase">{tile.kind}</span>
          {tile.ongoing === true && (
            <Badge variant="now" className="font-normal">
              {ongoingLabel}
            </Badge>
          )}
        </p>
        <h3 className="leading-snug font-semibold text-balance" lang={tile.titleLocale}>
          {/* The whole tile is the target; the verify link sits above it. */}
          <Link
            href={tile.href}
            className="after:absolute after:inset-0 after:rounded-xl group-hover:underline group-hover:underline-offset-4"
          >
            {tile.title}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {tile.organization !== undefined && <span>{tile.organization.name}</span>}
          {tile.date !== undefined && (
            <time dateTime={tile.date} className="font-mono text-xs tabular-nums">
              {formatPartialDate(tile.date, locale)}
            </time>
          )}
          {tile.verify !== undefined && (
            <ExternalLink
              href={tile.verify}
              className="group/link relative z-10 inline-flex min-h-11 items-center gap-0.5 font-mono text-xs underline underline-offset-4 hover:text-foreground sm:min-h-0"
            >
              {verifyLabel} <span className="sr-only">{tile.title}</span>
              <ArrowUpRightIcon className="icon-out size-3" aria-hidden />
            </ExternalLink>
          )}
        </p>
      </div>
    </li>
  );
}
