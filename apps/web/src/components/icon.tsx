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
}

/**
 * Renders a content icon: brand logos as inline SVG in currentColor, Lucide
 * icons as components. Always decorative; the text or aria-label next to it
 * names the thing.
 */
export function Icon({ icon, fallback: Fallback, className }: IconProps) {
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
          className={classes}
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
  return <Icon icon={icon} fallback={categoryIcons[category]} className={className} />;
}

export function ContentLinkIcon({ link, className }: { link: Pick<ContentLink, "icon" | "kind">; className?: string }) {
  return <Icon icon={link.icon} fallback={linkIcons[link.kind]} className={className} />;
}
