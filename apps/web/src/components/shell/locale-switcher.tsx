"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { savePlace } from "@/components/anchor/scroll-keeper";
import { Flag } from "@/components/flag";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, localeNames, routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function change(next: string) {
    if (next === locale) return;
    // The same place on the same page in the other locale (docs/guides/ui-state.md): the query (a projects tab,
    // an open photo) and the fragment come along, and the ScrollKeeper puts the reader back where they were.
    savePlace(pathname);
    const href = `${pathname}${window.location.search}${window.location.hash}`;
    startTransition(() => {
      router.replace(href, { locale: next as Locale, scroll: false });
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              // The ScrollKeeper gives the focus back here after the switch.
              data-locale-switcher=""
              variant="ghost"
              size="sm"
              aria-label={t("label")}
              disabled={pending}
              className="h-10 gap-1.5 px-2 lg:h-7"
            >
              <Flag locale={locale} />
              {/* The language code next to the flag: a flag names a country, not a language. */}
              <span aria-hidden className="font-mono text-xs uppercase">
                {locale.split("-")[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {/* The language in its own name, then the action; hidden while the menu is open. */}
        {!open && (
          <TooltipContent className="flex-col items-start gap-0">
            <span lang={locale} className="font-medium">
              {localeNames[locale]}
            </span>
            <span className="text-muted-foreground">{t("label")}</span>
          </TooltipContent>
        )}
      </Tooltip>
      {/* Sized to its items, not to the icon-wide trigger, so the check mark keeps its gap. */}
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuRadioGroup value={locale} onValueChange={change}>
          {routing.locales.map((value) => (
            <DropdownMenuRadioItem key={value} value={value} lang={value}>
              <Flag locale={value} />
              {localeNames[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
