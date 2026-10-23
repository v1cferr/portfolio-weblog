"use client";

import { Button } from "@workspace/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { Link, usePathname } from "@/i18n/navigation";

import { HOME_ITEM, NAV_ITEMS, SETUP_ITEM } from "./nav-items";

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
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active && "bg-accent text-foreground"
                )}
              >
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

export function MobileNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openMenu")}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Logo className="h-6" />
            <span className="sr-only">{t("brandHome")}</span>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label={t("label")} className="px-4">
          <ul className="flex flex-col gap-1">
            {[HOME_ITEM, ...NAV_ITEMS, SETUP_ITEM].map((item) => {
              const active = item.href === "/" ? pathname === "/" : isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-base hover:bg-accent",
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
      </SheetContent>
    </Sheet>
  );
}
