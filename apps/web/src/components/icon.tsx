import type * as React from "react";
import type { Link as ContentLink, TechnologyCategory } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";
import {
  AwardIcon,
  BoxIcon,
  CodeIcon,
  ContainerIcon,
  DatabaseIcon,
  FolderGit2Icon,
  GlobeIcon,
  LayersIcon,
  LinkIcon,
  type LucideIcon,
  MailIcon,
  MonitorPlayIcon,
  NewspaperIcon,
  ServerIcon,
  ShieldIcon,
  SparklesIcon,
  UserRoundIcon,
  WorkflowIcon,
  WrenchIcon,
} from "lucide-react";

import { brandIcons, lucideIcons } from "@/generated/icons";

/** The GitHub mark (Simple Icons), wherever a link means "a GitHub repository". */
export const GITHUB_MARK = "si:github";

type Category = (typeof TechnologyCategory.options)[number];

/** Generic icons when a technology has no official logo. */
const categoryIcons: Record<Category, LucideIcon> = {
  language: CodeIcon,
  framework: LayersIcon,
  library: BoxIcon,
  database: DatabaseIcon,
  platform: ServerIcon,
  infrastructure: ContainerIcon,
  tool: WrenchIcon,
  security: ShieldIcon,
  ai: SparklesIcon,
  practice: WorkflowIcon,
};

/** Generic icons for links without their own. */
const linkIcons: Record<ContentLink["kind"], LucideIcon> = {
  website: GlobeIcon,
  repository: FolderGit2Icon,
  demo: MonitorPlayIcon,
  article: NewspaperIcon,
  profile: UserRoundIcon,
  email: MailIcon,
  certificate: AwardIcon,
  other: LinkIcon,
};

interface IconProps {
  /** `si:`, `dv:` or `lucide:` reference from content. */
  icon?: string | undefined;
  /** Used when the reference is missing or unknown. */
  fallback: LucideIcon;
  className?: string;
  /** Tint brand logos with their own colour (see .brand-tint in globals.css). */
  tinted?: boolean;
}

/**
 * Renders a content icon: brand logos as inline SVG in currentColor, Lucide
 * icons as components. Always decorative; the text or aria-label next to it
 * names the thing.
 */
export function Icon({ icon, fallback: Fallback, className, tinted = false }: IconProps) {
  const classes = cn("size-4 shrink-0", className);
  if (icon !== undefined) {
    const brand = brandIcons[icon];
    if (brand !== undefined) {
      return (
        <svg
          viewBox={brand.viewBox}
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
          className={cn(classes, tinted && brand.hex !== "" && "brand-tint")}
          style={tinted && brand.hex !== "" ? ({ "--brand-hex": brand.hex } as React.CSSProperties) : undefined}
          // Trusted markup: generated at build time from the Simple Icons and Devicon packages.
          dangerouslySetInnerHTML={{ __html: brand.body }}
        />
      );
    }
    const Lucide = (lucideIcons as Record<string, LucideIcon | undefined>)[icon];
    if (Lucide !== undefined) return <Lucide aria-hidden className={classes} />;
  }
  return <Fallback aria-hidden className={classes} />;
}

export function TechnologyIcon({ icon, category, className }: { icon?: string | undefined; category: Category; className?: string }) {
  return <Icon icon={icon} fallback={categoryIcons[category]} className={className} tinted />;
}

/** True for a link to a repository hosted on GitHub. */
function isGitHubRepository(kind: ContentLink["kind"], url: string | undefined) {
  if (kind !== "repository" || url === undefined || !URL.canParse(url)) return false;
  return new URL(url).hostname === "github.com";
}

/**
 * The icon of a content link. A GitHub repository shows the GitHub mark, kept
 * monochrome (currentColor) as GitHub's brand rules ask, instead of the
 * generic repository folder.
 */
export function ContentLinkIcon({ link, className }: { link: Pick<ContentLink, "icon" | "kind"> & { url?: string }; className?: string }) {
  const icon = link.icon ?? (isGitHubRepository(link.kind, link.url) ? GITHUB_MARK : undefined);
  return <Icon icon={icon} fallback={linkIcons[link.kind]} className={className} />;
}
