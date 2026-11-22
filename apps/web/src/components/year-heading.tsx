import { Badge } from "@workspace/ui/components/badge";

/**
 * The sticky glass pill that opens each year of a timeline: the year, then
 * how many entries it holds. Rendered as the heading level the page needs.
 */
export function YearHeading({ as: Heading, year, count, label }: { as: "h2" | "h3"; year: string; count: number; label: string }) {
  return (
    <Badge asChild variant="glass" className="sticky top-17 z-10 my-3">
      <Heading aria-label={label}>
        {year}
        <span aria-hidden className="text-muted-foreground">
          · {count}
        </span>
      </Heading>
    </Badge>
  );
}
