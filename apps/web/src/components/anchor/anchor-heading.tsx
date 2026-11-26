import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

import { CopyLink } from "./copy-link";

/**
 * A heading that can be linked to (`/page#id`): the id, the deep-link
 * highlight and the copy-link button beside it. The button sits outside the
 * heading, so the heading's accessible name stays its own text.
 */
export function AnchorHeading({
  id,
  as: Tag = "h2",
  className,
  wrapperClassName,
  children,
}: {
  id: string;
  as?: "h2" | "h3" | "h4";
  className?: string;
  wrapperClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("group/anchor flex items-baseline gap-1", wrapperClassName)}>
      <Tag id={id} data-anchor="" className={className}>
        {children}
      </Tag>
      <CopyLink id={id} nameId={id} className="self-center" />
    </div>
  );
}
