"use client";

import { Button } from "@workspace/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import { MenuIcon } from "lucide-react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { NAV_SECTION } from "@/components/page-transition";
import { Logo } from "@/components/logo";
import { Link, usePathname } from "@/i18n/navigation";
import type { ExplorerFolder } from "@/lib/explorer-tree";

import { ExplorerTree } from "./explorer-sheet";
import { HOME_ITEM, NAV_ITEMS } from "./nav-items";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop links. Active state needs the current path, hence a client component. */
export function MainNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                transitionTypes={NAV_SECTION}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative isolate inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm whitespace-nowrap xl:px-2.5 text-muted-foreground transition-colors hover:text-foreground",
                  active ? "text-accent-foreground" : "hover:bg-accent"
                )}
              >
                {/* One pill for the whole bar: the shared layoutId makes it slide
                    from the old item to the new one (a plain swap with reduced motion). */}
                {active && (
                  <m.span
                    layoutId="main-nav-pill"
                    data-nav-pill=""
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-full bg-accent"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <item.icon aria-hidden className="size-4" />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav({ explorer }: { explorer: ExplorerFolder }) {
  const t = useTranslations("Nav");
  const tExplorer = useTranslations("Explorer");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 lg:hidden" aria-label={t("openMenu")}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      {/* Touch-sized: the close button grows from 28px to 40px, the links to 44px tall. */}
      <SheetContent side="right" className="w-72 [&>[data-slot=sheet-close]]:size-10">
        <SheetHeader>
          <SheetTitle>
            <Logo className="h-6" />
            <span className="sr-only">{t("brandHome")}</span>
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          <nav aria-label={t("label")}>
            <ul className="flex flex-col gap-1">
              {[HOME_ITEM, ...NAV_ITEMS].map((item) => {
                const active = item.href === "/" ? pathname === "/" : isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      transitionTypes={NAV_SECTION}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        setOpen(false);
                      }}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-base hover:bg-accent",
                        active && "bg-accent font-medium"
                      )}
                    >
                      <item.icon aria-hidden className="size-4 text-muted-foreground" />
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {/* The "~/" explorer, after the sections it complements: the same tree as the desktop panel. */}
          <nav aria-label={tExplorer("label")} className="mt-3 border-t border-border/60 pt-3">
            <ExplorerTree
              // Named here, since the menu has no "~/" title above it.
              tree={{ ...explorer, label: tExplorer("label") }}
              rootOpen={false}
              onNavigate={() => {
                setOpen(false);
              }}
            />
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
