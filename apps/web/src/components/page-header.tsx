import { cn } from "@workspace/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Path of the content this page renders, e.g. "content/experiences". */
  eyebrow?: string;
  /** The section's icon, shown with the eyebrow. */
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

/**
 * Page title block. The eyebrow names where the page's data lives in the
 * repository: the hub is a view over versioned content, and says so.
 */
export function PageHeader({ eyebrow, icon: Glyph, title, description, children }: PageHeaderProps) {
  return (
    <header className="mb-10 space-y-3 border-b pb-8 md:mb-14">
      {eyebrow !== undefined && (
        <p className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground">
          {Glyph !== undefined && (
            <span className="inline-flex size-7 items-center justify-center rounded-lg border bg-card text-foreground">
              <Glyph aria-hidden className="size-4" />
            </span>
          )}
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">{title}</h1>
      {description !== undefined && <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{description}</p>}
      {children}
    </header>
  );
}

export function SectionHeading({
  children,
  id,
  action,
  icon: Glyph,
  branch,
}: {
  children: ReactNode;
  id?: string;
  action?: ReactNode;
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
      {action}
    </div>
  );
}
