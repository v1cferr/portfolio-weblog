import type { Link as ContentLink } from "@workspace/content";
import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";

import { ContentLinkIcon, hasBrandColour } from "./icon";
import { ExternalLink } from "@/components/external-link";

/**
 * Profile links as icon buttons. The name is the accessible label and the
 * tooltip, so the row stays compact without losing what each link is.
 *
 * `tinted` shows each brand logo in its official colour (clamped for contrast
 * by .brand-tint; GitHub and X stay monochrome because their colour is black),
 * and icons without a brand colour in the accent, so the row stands out
 * without depending on hover. Untinted, the icons stay muted until active.
 */
export function SocialLinks({
  links,
  label,
  size = "default",
  tinted = false,
  className,
}: {
  links: readonly ContentLink[];
  label: string;
  size?: "default" | "sm";
  tinted?: boolean;
  className?: string;
}) {
  return (
    <ul aria-label={label} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {links.map((link) => (
        <li key={link.url}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size={size === "sm" ? "icon-sm" : "icon-lg"} className="rounded-full">
                <ExternalLink href={link.url} aria-label={link.label} me={link.kind === "profile"} className="group/link">
                  <ContentLinkIcon
                    link={link}
                    tinted={tinted}
                    className={cn(
                      "icon-lift",
                      !tinted && "icon-muted",
                      tinted && !hasBrandColour(link) && "text-primary",
                      size === "sm" ? "size-3.5" : "size-[1.1rem]"
                    )}
                  />
                </ExternalLink>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{link.label}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
