import type { Organization } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";

const sizes = {
  sm: "size-6 rounded-full",
  default: "size-9 rounded-md",
  lg: "size-12 rounded-lg",
} as const;

/**
 * The organization's logo on a white tile, rendered on the server so it never
 * flashes initials first. Initials only stand in when there is no logo.
 */
export function OrganizationMark({ organization, size = "default" }: { organization: Organization; size?: keyof typeof sizes }) {
  const initials = organization.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden border bg-white", sizes[size])}>
      {organization.logo !== undefined ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny static logos; next/image adds nothing here
        <img src={organization.logo} alt="" className="size-full object-contain p-0.5" decoding="async" />
      ) : (
        <span aria-hidden className="font-mono text-xs text-[#3b4261]">
          {initials}
        </span>
      )}
    </span>
  );
}
