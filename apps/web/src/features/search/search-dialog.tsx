"use client";

import { Button } from "@workspace/ui/components/button";
import { Kbd } from "@workspace/ui/components/kbd";
import { SparklesIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { MotionButton } from "@/components/motion/motion-button";
import { SearchLensIcon } from "@/components/motion/state-icons";

import { type AskOpenDetail, openAsk } from "@/features/ask/open-ask";
import type { AskOpenSource } from "@/features/ask/ask-provider";

import { SEARCH_OPEN_EVENT, type SearchOpenDetail } from "./open-search";

// The dialog, cmdk and the search engine are only downloaded once someone
// opens them; every page ships just these buttons and the shortcut.
const SearchPanel = dynamic(() => import("./search-panel"), { ssr: false });

/**
 * The header's Search and Ask buttons. Search, `/` and Ctrl/Cmd+K open the
 * search dialog; Ask opens the docked chat (features/ask/ask-dock.tsx).
 */
export function SearchDialog() {
  const t = useTranslations("Search");
  const ask = useTranslations("Ask");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [opener, setOpener] = useState<HTMLElement | null>(null);

  function openSearch(from: HTMLElement | null, text = "") {
    setOpener(from);
    setQuery(text);
    setLoaded(true);
    setOpen(true);
  }

  // openSearch() from anywhere, e.g. the Ask dock's "Search the site" with the question typed in.
  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<SearchOpenDetail | null>).detail ?? {};
      setOpener(document.activeElement instanceof HTMLElement ? document.activeElement : null);
      setQuery(detail.query ?? "");
      setLoaded(true);
      setOpen(true);
    }
    window.addEventListener(SEARCH_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !isTyping(event.target))) {
        event.preventDefault();
        setLoaded(true);
        setQuery("");
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
        <MotionButton
          variant="outline"
          size="sm"
          onClick={(event) => {
            openSearch(event.currentTarget);
          }}
          className="h-10 gap-2 px-3 text-muted-foreground max-sm:w-[34px] max-sm:rounded-r-none max-sm:px-0 lg:h-7 lg:px-2.5"
          aria-label={t("open")}
          aria-haspopup="dialog"
        >
          <SearchLensIcon className="size-3.5" />
          <span className="hidden sm:inline">{t("open")}</span>
          <Kbd className="hidden font-mono md:inline-flex">/</Kbd>
        </MotionButton>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const detail: AskOpenDetail & { from: AskOpenSource } = { from: "header" };
            openAsk(detail);
          }}
          className="h-10 gap-2 px-3 text-muted-foreground max-sm:-ml-px max-sm:w-[34px] max-sm:rounded-l-none max-sm:px-0 lg:h-7 lg:px-2.5"
          aria-label={ask("openLabel")}
        >
          <SparklesIcon />
          <span className="hidden sm:inline">{ask("open")}</span>
        </Button>
      </div>
      {loaded && <SearchPanel open={open} onOpenChange={setOpen} initialQuery={query} returnFocus={opener} />}
    </>
  );
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}
