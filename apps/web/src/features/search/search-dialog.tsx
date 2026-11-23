"use client";

import { Button } from "@workspace/ui/components/button";
import { Kbd } from "@workspace/ui/components/kbd";
import { SearchIcon, SparklesIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { PanelMode } from "./search-panel";

// The dialog, cmdk, the search engine and the Ask panel are only downloaded
// once someone opens them; every page ships just these buttons and the shortcut.
const SearchPanel = dynamic(() => import("./search-panel"), { ssr: false });

/** Search and Ask triggers: two buttons plus the `/` and Ctrl/Cmd+K shortcuts, all opening one dialog. */
export function SearchDialog() {
  const t = useTranslations("Search");
  const ask = useTranslations("Ask");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<PanelMode>("search");
  const [opener, setOpener] = useState<HTMLElement | null>(null);

  function openIn(next: PanelMode, from: HTMLElement) {
    setOpener(from);
    setMode(next);
    setLoaded(true);
    setOpen(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !isTyping(event.target))) {
        event.preventDefault();
        setLoaded(true);
        setMode("search");
        setOpener(document.activeElement instanceof HTMLElement ? document.activeElement : null);
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>
      {/* On phones the two buttons join into one segmented pill, so the header still fits at 360px with the now-playing chip. */}
      <div className="flex items-center sm:gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            openIn("search", event.currentTarget);
          }}
          className="h-10 gap-2 px-3 text-muted-foreground max-sm:w-[34px] max-sm:rounded-r-none max-sm:px-0 lg:h-7 lg:px-2.5"
          aria-label={t("open")}
          aria-haspopup="dialog"
        >
          <SearchIcon />
          <span className="hidden sm:inline">{t("open")}</span>
          <Kbd className="hidden font-mono md:inline-flex">/</Kbd>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            openIn("ask", event.currentTarget);
          }}
          className="h-10 gap-2 px-3 text-muted-foreground max-sm:-ml-px max-sm:w-[34px] max-sm:rounded-l-none max-sm:px-0 lg:h-7 lg:px-2.5"
          aria-label={ask("openLabel")}
          aria-haspopup="dialog"
        >
          <SparklesIcon />
          <span className="hidden sm:inline">{ask("open")}</span>
        </Button>
      </div>
      {loaded && <SearchPanel open={open} onOpenChange={setOpen} mode={mode} onModeChange={setMode} returnFocus={opener} />}
    </>
  );
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}
