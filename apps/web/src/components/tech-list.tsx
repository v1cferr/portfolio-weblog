import { Badge } from "@workspace/ui/components/badge";

import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";

/** Technology badges; each one opens the project catalogue filtered by it. */
export function TechList({ ids, label }: { ids: readonly string[]; label: string }) {
  const content = getContent();
  const items = ids.map((id) => content.getTechnology(id)).filter((tech) => tech !== undefined);
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((tech) => (
        <li key={tech.id}>
          <Badge variant="outline" asChild className="font-normal">
            <Link href={{ pathname: "/projects", query: { tech: tech.id } }}>{tech.name}</Link>
          </Badge>
        </li>
      ))}
    </ul>
  );
}
