import { cn } from "@workspace/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { InfoTip } from "@/components/info-tip";
import { storePath } from "@/lib/store-path";

interface PageHeaderProps {
  /** The content this page is built from, under content/ ("experiences", "profile/setup.yaml", "" for all of it). */
  source?: { path: string; name?: string };
  /** The section's icon, shown with the eyebrow. */
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Helper text behind an "i" next to the description (see InfoTip). */
  info?: ReactNode;
  children?: ReactNode;
}

/**
 * Page title block. The eyebrow names the content the page is built from as a
 * Nix store path, with a real content hash (see lib/store-path.ts): the hub is
 * a view over versioned content, and says so the way Nix would.
 */
export function PageHeader({ source, icon: Glyph, title, description, info, children }: PageHeaderProps) {
  return (
    <header className="mb-10 space-y-3 border-b pb-8 md:mb-14">
      {source !== undefined && (
        <p className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground">
          {Glyph !== undefined && (
            <span className="inline-flex size-7 items-center justify-center rounded-lg border bg-card text-foreground">
              <Glyph aria-hidden className="size-4" />
            </span>
          )}
          <StorePath path={source.path} name={source.name} />
        </p>
      )}
      <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">{title}</h1>
      {description !== undefined && (
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          {description}
          {info !== undefined && (
            <>
              {" "}
              <InfoTip className="-mt-0.5" align="start">
                {info}
              </InfoTip>
            </>
          )}
        </p>
      )}
      {children}
    </header>
  );
}

export function SectionHeading({
  children,
  id,
  action,
  info,
  icon: Glyph,
  branch,
}: {
  children: ReactNode;
  id?: string;
  action?: ReactNode;
  /** Helper text behind an "i" beside the heading (see InfoTip). */
  info?: ReactNode;
  icon?: LucideIcon;
  /** On the home page's git spine: the branch drawn to this heading (its node replaces the icon on wide screens). */
  branch?: ReactNode;
}) {
  return (
    <div className="relative mb-5 flex items-baseline justify-between gap-4">
      {branch}
      <h2 id={id} className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight">
        {Glyph !== undefined && (
          <Glyph aria-hidden className={cn("size-5 self-center text-muted-foreground", branch !== undefined && "lg:hidden")} />
        )}
        {children}
      </h2>
      {info !== undefined && (
        <InfoTip className="mr-auto -ml-2 self-center" align="start">
          {info}
        </InfoTip>
      )}
      {action}
    </div>
  );
}

/** /nix/store/<hash>-<name>, with the hash shortened on screen and whole in the tooltip. */
export function StorePath({ path, name }: { path: string; name?: string | undefined }) {
  const { label, hash } = storePath(path, name);
  return (
    <span title={label} className="min-w-0 truncate">
      /nix/store/{hash.slice(0, 7)}
      <span className="text-muted-foreground/60">…</span>-{label.slice(label.indexOf(hash) + hash.length + 1)}
    </span>
  );
}
