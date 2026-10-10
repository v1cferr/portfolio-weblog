import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import type { Organization } from "@workspace/content";

export function OrganizationMark({ organization, size = "default" }: { organization: Organization; size?: "default" | "lg" }) {
  const initials = organization.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
  return (
    <Avatar className={size === "lg" ? "size-12 rounded-lg" : "size-9 rounded-md"}>
      {organization.logo !== undefined && <AvatarImage src={organization.logo} alt="" className="bg-white object-contain p-0.5" />}
      <AvatarFallback className="rounded-md font-mono text-xs">{initials}</AvatarFallback>
    </Avatar>
  );
}
