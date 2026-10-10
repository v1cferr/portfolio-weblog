import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Path of the content this page renders, e.g. "content/experiences". */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

/**
 * Page title block. The eyebrow names where the page's data lives in the
 * repository: the hub is a view over versioned content, and says so.
 */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className="mb-10 space-y-3 border-b pb-8 md:mb-14">
      {eyebrow !== undefined && <p className="font-mono text-xs tracking-wide text-muted-foreground">{eyebrow}</p>}
      <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">{title}</h1>
      {description !== undefined && <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{description}</p>}
      {children}
    </header>
  );
}

export function SectionHeading({ children, id, action }: { children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 id={id} className="font-display text-2xl font-semibold tracking-tight">
        {children}
      </h2>
      {action}
    </div>
  );
}
