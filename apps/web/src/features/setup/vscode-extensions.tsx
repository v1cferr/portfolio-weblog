import { localize, type Setup, vscodeExtensionAnchor, vscodeExtensionIcon } from "@workspace/content";
import { BlocksIcon, ChevronDownIcon, ExternalLinkIcon, PuzzleIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { CopyLink } from "@/components/anchor/copy-link";
import { ExternalLink } from "@/components/external-link";
import { Icon } from "@/components/icon";
import { SectionHeading } from "@/components/page-header";
import { SessionDetails } from "@/components/session-disclosure";
import { formatPartialDate } from "@/lib/dates";

/** Groups shown before "Show all": enough to read the page, short on a phone. */
const VISIBLE_GROUPS = 3;

type Extensions = NonNullable<Setup["vscodeExtensions"]>;
type Group = Extensions["groups"][number];

const marketplaceUrl = (id: string) => `https://marketplace.visualstudio.com/items?itemName=${id}`;

/**
 * The VS Code extensions on /setup (`/setup#vscode-extensions`), grouped by
 * purpose, each with its official Marketplace icon when it has one (`pnpm
 * vscode:icons`) and its `icon` logo otherwise. Each extension is a deep link
 * (`/setup#vscode-<publisher>-<name>`); the groups past the first few fold into a disclosure that stays as the
 * reader left it for the tab, and a deep link into it opens it
 * (components/anchor/hash-target.tsx).
 */
export async function VscodeExtensions({ extensions }: { extensions: Extensions }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Setup")]);
  const count = extensions.groups.reduce((total, group) => total + group.items.length, 0);
  const visible = extensions.groups.slice(0, VISIBLE_GROUPS);
  const folded = extensions.groups.slice(VISIBLE_GROUPS);

  const group = (item: Group) => {
    const title = localize(item.title, locale);
    const headingId = `vscode-${item.id}`;
    return (
      <div key={item.id} className="space-y-3">
        <h3 id={headingId} data-anchor="" className="group/anchor flex items-center gap-1 text-base font-medium">
          <span lang={title.locale}>{title.value}</span>
          <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">{item.items.length}</span>
          <CopyLink id={headingId} name={title.value} />
        </h3>
        <ul aria-label={t("extensionsList", { group: title.value })} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {item.items.map((extension) => {
            const anchor = vscodeExtensionAnchor(extension.id);
            return (
              <li
                key={extension.id}
                id={anchor}
                data-anchor=""
                className="group/anchor glass flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                {extension.marketplaceIcon === true ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a 72 px static icon shown at 24 px; next/image adds nothing here
                  <img
                    src={vscodeExtensionIcon(extension.id)}
                    alt=""
                    width={24}
                    height={24}
                    loading="lazy"
                    decoding="async"
                    className="size-6 shrink-0 rounded-[22%] object-contain"
                  />
                ) : (
                  <Icon icon={extension.icon} fallback={PuzzleIcon} tinted className="size-5 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <ExternalLink
                    href={extension.url ?? marketplaceUrl(extension.id)}
                    className="group/link flex items-start gap-1 text-sm font-medium break-words hover:text-lane-project"
                  >
                    <span className="min-w-0">{extension.name}</span>
                    <ExternalLinkIcon className="icon-out mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden />
                  </ExternalLink>
                  <span className="block truncate font-mono text-xs text-muted-foreground">{extension.id}</span>
                </span>
                <CopyLink id={anchor} name={extension.name} />
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <section aria-labelledby="vscode-extensions" className="mt-14">
      <SectionHeading
        id="vscode-extensions"
        icon={BlocksIcon}
        info={
          <>
            {t("extensionsInfo", { count, date: formatPartialDate(extensions.syncedAt, locale) })}{" "}
            <ExternalLink href={extensions.source} className="underline underline-offset-4">
              {t("extensionsSource")}
            </ExternalLink>
          </>
        }
      >
        {t("extensions")}
      </SectionHeading>
      <div className="space-y-8">{visible.map(group)}</div>
      {folded.length > 0 && (
        <SessionDetails stateId="vscode-extensions" className="group mt-6">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted [&::-webkit-details-marker]:hidden">
            <ChevronDownIcon aria-hidden className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
            <span className="group-open:hidden">{t("extensionsMore", { count })}</span>
            <span className="hidden group-open:inline">{t("extensionsLess")}</span>
          </summary>
          <div className="mt-8 space-y-8">{folded.map(group)}</div>
        </SessionDetails>
      )}
    </section>
  );
}
