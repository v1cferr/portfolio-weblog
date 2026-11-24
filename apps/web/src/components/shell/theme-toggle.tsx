"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { MotionButton } from "@/components/motion/motion-button";
import { type ThemeChoice, ThemeStateIcon } from "@/components/motion/state-icons";

const noop = () => () => undefined;

/** False on the server and while hydrating, true after: the stored theme is only known in the browser. */
function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}

function isChoice(value: string | undefined): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeToggle() {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const choice = hydrated ? (isChoice(theme) ? theme : "system") : undefined;
  return (
    <DropdownMenu>
      {/*
        Disabled until hydration commits. The button is in the server HTML, but
        a press that lands while React is still hydrating the header is lost
        (the menu opens on pointerdown, and that event never reaches Radix), so
        an early click did nothing. Disabled says "not yet" instead, and stays
        true without JavaScript, where the menu cannot open at all.
      */}
      <DropdownMenuTrigger asChild disabled={!hydrated}>
        <MotionButton variant="ghost" size="icon" aria-label={t("label")} className="size-10 lg:size-8">
          <ThemeStateIcon choice={choice} />
        </MotionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <SunIcon /> {t("light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon /> {t("dark")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon /> {t("system")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
