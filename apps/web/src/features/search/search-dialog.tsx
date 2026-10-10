"use client";

import { Button } from "@workspace/ui/components/button";
import { SearchIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// The dialog, cmdk and the search engine are only downloaded once someone
// opens search; every page ships just this button and the shortcut.
const SearchPanel = dynamic(() => import("./search-panel"), { ssr: false });

/** Search trigger: a button plus the `/` and Ctrl/Cmd+K shortcuts. */
export function SearchDialog() {
  const t = useTranslations("Search");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) setLoaded(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !isTyping(event.target))) {
        event.preventDefault();
        setLoaded(true);
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          changeOpen(true);
        }}
        className="gap-2 text-muted-foreground"
        aria-label={t("open")}
        aria-haspopup="dialog"
      >
        <SearchIcon />
        <span className="hidden sm:inline">{t("open")}</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[0.65rem] md:inline">/</kbd>
      </Button>
      {loaded && <SearchPanel open={open} onOpenChange={changeOpen} />}
    </>
  );
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}
