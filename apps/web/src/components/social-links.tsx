import type { Link as ContentLink } from "@workspace/content";
import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";

import { ContentLinkIcon } from "./icon";

/**
 * Profile links as icon buttons. The name is the accessible label and the
 * tooltip, so the row stays compact without losing what each link is.
 */
export function SocialLinks({
  links,
  label,
  size = "default",
  className,
}: {
  links: readonly ContentLink[];
  label: string;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <ul aria-label={label} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {links.map((link) => (
        <li key={link.url}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size={size === "sm" ? "icon-sm" : "icon-lg"} className="rounded-full">
                <a href={link.url} aria-label={link.label} rel={link.kind === "profile" ? "me" : undefined}>
                  <ContentLinkIcon link={link} className={size === "sm" ? "size-3.5" : "size-[1.1rem]"} />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{link.label}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
