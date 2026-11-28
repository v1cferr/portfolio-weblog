import type { Organization } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

const sizes = {
  xs: "size-4",
  sm: "size-6",
  default: "size-9",
  lg: "size-12",
} as const;

/**
 * The organization's official logo on its own transparent background, as the
 * brand ships it (the owner's choice, 2026-11-24: no white tile around it).
 * A logo that vanishes on a dark page has a `logoDark` variant. Rendered on the
 * server so it never flashes initials first; initials stand in only when there
 * is no logo, unless the caller passes a `fallback` (e.g. the generic icon a
 * study tile used before it had logos).
 *
 * Lazy on purpose: React preloads every eager `<img>` it renders on the server,
 * so a page with a dozen logos sent a dozen preloads (light and dark) that
 * competed with the hero photo. A lazy image hidden by the theme (`hidden`) is
 * never fetched, so only the visible variant downloads.
 */
export function OrganizationMark({
  organization,
  size = "default",
  fallback,
}: {
  organization: Organization;
  size?: keyof typeof sizes;
  fallback?: ReactNode;
}) {
  if (organization.logo === undefined && fallback !== undefined) return fallback;
  const initials = organization.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
  const logo = (src: string, className?: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static logos; next/image adds nothing here
    <img src={src} alt="" className={cn("size-full rounded-[22%] object-contain", className)} loading="lazy" decoding="async" />
  );
  return (
    <span data-organization={organization.id} className={cn("inline-flex shrink-0 items-center justify-center", sizes[size])}>
      {organization.logo === undefined ? (
        <span
          aria-hidden
          className="flex size-full items-center justify-center rounded-md border bg-muted font-mono text-xs text-muted-foreground"
        >
          {initials}
        </span>
      ) : organization.logoDark === undefined ? (
        logo(organization.logo)
      ) : (
        <>
          {logo(organization.logo, "dark:hidden")}
          {logo(organization.logoDark, "hidden dark:block")}
        </>
      )}
    </span>
  );
}
