import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@workspace/ui/components/empty";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** One empty state for the whole site: an icon, what is missing and, when there is one, what to do next. */
export function EmptyState({ icon: Glyph, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <Empty className="glass rounded-xl border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Glyph aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-sans text-base font-medium">{title}</EmptyTitle>
      </EmptyHeader>
      {children !== undefined && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}
