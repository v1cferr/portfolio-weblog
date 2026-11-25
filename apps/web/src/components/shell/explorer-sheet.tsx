"use client";

import { Button } from "@workspace/ui/components/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronRightIcon, FileIcon, FileTextIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { InfoTip } from "@/components/info-tip";
import { NAV_SECTION } from "@/components/page-transition";
import { Link, usePathname } from "@/i18n/navigation";
import type { ExplorerFolder, ExplorerNode } from "@/lib/explorer-tree";

const STORAGE_KEY = "explorer:open";

/** Folders the visitor opened or closed, by path. Storage can be blocked (private windows), so every access is guarded. */
function readStored(): Record<string, boolean> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeStored(value: Record<string, boolean>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Remembering is a convenience; without storage every visit starts from the defaults.
  }
}

function contains(node: ExplorerNode, pathname: string): boolean {
  return node.kind === "file" ? node.href === pathname : node.children.some((child) => contains(child, pathname));
}

/**
 * The "~/" explorer: the site as a file tree, a second way to navigate next
 * to the main navigation. Plain disclosure widgets and links (details,
 * summary, a), not an ARIA tree, so it works with every screen reader and
 * without JavaScript-driven focus management. On desktop, a side panel
 * opened from the "~/" button; on phones and tablets the same tree is a
 * section of the menu sheet, under the primary navigation.
 */
export function ExplorerSheet({ tree }: { tree: ExplorerFolder }) {
  const t = useTranslations("Explorer");
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          // Desktop only: below lg the tree is a section of the menu sheet, so the header keeps its room at 360px.
          className="hidden h-7 px-2 font-mono text-sm text-muted-foreground hover:text-foreground lg:inline-flex"
          aria-label={t("open")}
        >
          ~/
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        // Glass like the header; the close button grows to a 40px touch target, and nothing slides with reduced motion.
        className="glass-float gap-0 bg-(--glass-tint) motion-reduce:animate-none data-[side=left]:w-[min(22rem,calc(100vw-2.5rem))] data-[side=left]:border-r-0 [&>[data-slot=sheet-close]]:size-10 lg:[&>[data-slot=sheet-close]]:size-8"
      >
        <SheetHeader className="pr-14">
          <div className="flex items-center gap-1">
            <SheetTitle className="font-mono text-base">~/</SheetTitle>
            <InfoTip align="start">{t("description")}</InfoTip>
          </div>
          {/* The dialog keeps its description for screen readers; on screen it is behind the "i". */}
          <SheetDescription className="sr-only">{t("description")}</SheetDescription>
        </SheetHeader>
        <nav aria-label={t("label")} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
          <ExplorerTree
            tree={tree}
            onNavigate={() => {
              setOpen(false);
            }}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The tree itself, for the "~/" panel and for the phone menu. Mount it only
 * inside an open sheet: it reads storage while rendering, which the server
 * render never sees.
 */
export function ExplorerTree({
  tree,
  onNavigate,
  rootOpen = true,
}: {
  tree: ExplorerFolder;
  onNavigate: () => void;
  /** Whether `~/` starts open; the phone menu keeps it closed under the main sections. */
  rootOpen?: boolean;
}) {
  const pathname = usePathname();
  const [stored, setStored] = useState(readStored);

  function isOpen(folder: ExplorerFolder) {
    // What the visitor chose wins; otherwise the way to the current page is open, and the root as asked.
    return stored[folder.path] ?? (folder.path === tree.path ? rootOpen : contains(folder, pathname));
  }

  function toggle(folder: ExplorerFolder, next: boolean) {
    if (next === isOpen(folder)) return;
    const value = { ...stored, [folder.path]: next };
    setStored(value);
    writeStored(value);
  }

  function renderNode(node: ExplorerNode) {
    if (node.kind === "file") {
      const current = node.href === pathname;
      const Icon = node.icon === "post" ? FileTextIcon : FileIcon;
      return (
        <li key={node.href}>
          <Link
            href={node.href}
            transitionTypes={NAV_SECTION}
            aria-current={current ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md px-2 py-1 hover:bg-accent focus-visible:bg-accent lg:min-h-8",
              current && "bg-accent text-accent-foreground"
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className={cn("truncate font-mono text-sm", current && "font-semibold")}>{node.name}</span>
              {!repeatsName(node.name, node.label) && (
                <span className="truncate text-xs text-muted-foreground" lang={node.lang}>
                  {node.label}
                </span>
              )}
            </span>
          </Link>
        </li>
      );
    }
    // From state, not a group-open variant: that would also match an open ancestor folder.
    const open = isOpen(node);
    const Folder = open ? FolderOpenIcon : FolderIcon;
    return (
      <li key={node.path}>
        <details
          open={open}
          onToggle={(event) => {
            toggle(node, event.currentTarget.open);
          }}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md px-1 py-1 select-none hover:bg-accent focus-visible:bg-accent lg:min-h-8 [&::-webkit-details-marker]:hidden">
            <ChevronRightIcon
              aria-hidden
              className={cn("size-4 shrink-0 text-muted-foreground motion-safe:transition-transform", open && "rotate-90")}
            />
            <Folder aria-hidden className="size-4 shrink-0 text-lane-project" />
            <span className="font-mono text-sm">{node.name}/</span>
            {node.label !== undefined && !repeatsName(node.name, node.label) && (
              <span className="truncate text-xs text-muted-foreground">{node.label}</span>
            )}
          </summary>
          <ul className="ml-3 border-l border-border/60 pl-1.5">{node.children.map(renderNode)}</ul>
        </details>
      </li>
    );
  }

  return <ul>{renderNode(tree)}</ul>;
}

/**
 * Whether a label only repeats the file or folder name ("career/ Career" in
 * en-us). Those are hidden; translated ones ("career/ Carreira") stay.
 */
function repeatsName(name: string, label: string | undefined): boolean {
  if (label === undefined) return true;
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalize(name) === normalize(label);
}
