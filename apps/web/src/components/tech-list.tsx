import { Badge } from "@workspace/ui/components/badge";

import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";

import { TechnologyIcon } from "./icon";

/**
 * Technology badges with their logos; each opens the project catalogue
 * filtered by it. With a limit, the rest collapse into a "+N" badge that links
 * to where the full list is.
 */
export function TechList({
  ids,
  label,
  limit,
  moreHref,
  moreLabel,
}: {
  ids: readonly string[];
  label: string;
  limit?: number;
  moreHref?: string;
  /** Accessible name of the "+N" badge. */
  moreLabel?: string;
}) {
  const content = getContent();
  const all = ids.map((id) => content.getTechnology(id)).filter((tech) => tech !== undefined);
  if (all.length === 0) return null;
  const items = limit !== undefined ? all.slice(0, limit) : all;
  const hidden = all.length - items.length;
  const more = (
    <>
      <span aria-hidden>+{hidden}</span>
      {moreLabel !== undefined && <span className="sr-only">{moreLabel}</span>}
    </>
  );
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((tech) => (
        <li key={tech.id}>
          <Badge variant="outline" asChild className="gap-1.5 font-normal">
            <Link href={{ pathname: "/projects", query: { tech: tech.id } }}>
              <TechnologyIcon icon={tech.icon} category={tech.category} className="size-3.5" />
              {tech.name}
            </Link>
          </Badge>
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <Badge variant="outline" asChild={moreHref !== undefined} className="font-mono font-normal text-muted-foreground">
            {moreHref !== undefined ? <Link href={moreHref}>{more}</Link> : <span>{more}</span>}
          </Badge>
        </li>
      )}
    </ul>
  );
}
