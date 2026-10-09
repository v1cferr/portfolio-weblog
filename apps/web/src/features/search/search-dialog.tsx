"use client";

import { Button } from "@workspace/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { type SearchDocument, type SearchEntityType, searchOptions } from "@workspace/search/options";
import MiniSearch from "minisearch";
import { SearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "@/i18n/navigation";

type Hit = Pick<SearchDocument, "id" | "entityId" | "type" | "title" | "url" | "excerpt">;
type State = { status: "idle" | "loading" | "error" } | { status: "ready"; index: MiniSearch<SearchDocument> };

const GROUP_ORDER: SearchEntityType[] = ["experience", "project", "post", "education", "certification", "technology"];

/**
 * Site search. The index (public content only) is a static JSON file per
 * locale, fetched the first time the dialog opens; queries run in the browser.
 */
export function SearchDialog() {
  const t = useTranslations("Search");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const toggle = useRef(() => {});

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !isTyping(event.target))) {
        event.preventDefault();
        toggle.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function load() {
    setState({ status: "loading" });
    fetch(`/api/search/${locale}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
        return response.json() as Promise<SearchDocument[]>;
      })
      .then((docs) => {
        const index = new MiniSearch<SearchDocument>(searchOptions);
        index.addAll(docs);
        setState({ status: "ready", index });
      })
      .catch(() => {
        setState({ status: "error" });
      });
  }

  // The index is fetched the first time the dialog opens, not on page load.
  function changeOpen(next: boolean) {
    setOpen(next);
    if (next && state.status === "idle") load();
  }

  useEffect(() => {
    toggle.current = () => {
      changeOpen(!open);
    };
  });

  const groups = useMemo(() => {
    if (state.status !== "ready" || query.trim().length < 2) return [];
    const hits = state.index.search(query).slice(0, 20) as unknown as Hit[];
    return GROUP_ORDER.map((type) => ({ type, hits: hits.filter((hit) => hit.type === type) })).filter((group) => group.hits.length > 0);
  }, [state, query]);

  function go(url: string) {
    setOpen(false);
    // Search URLs carry the locale prefix; the i18n router adds its own.
    router.push(url.replace(new RegExp(`^/${locale}`), "") || "/");
  }

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
      >
        <SearchIcon />
        <span className="hidden sm:inline">{t("open")}</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[0.65rem] md:inline">/</kbd>
      </Button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("hint")}</DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false} className="[&_[cmdk-input-wrapper]]:border-b">
            <CommandInput value={query} onValueChange={setQuery} placeholder={t("placeholder")} />
            <CommandList className="max-h-[60vh]">
              {state.status === "loading" && <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>}
              {state.status === "error" && (
                <p role="alert" className="p-4 text-sm text-destructive">
                  {t("error")}
                </p>
              )}
              {state.status === "ready" && query.trim().length < 2 && <p className="p-4 text-sm text-muted-foreground">{t("hint")}</p>}
              {state.status === "ready" && query.trim().length >= 2 && <CommandEmpty>{t("empty", { query })}</CommandEmpty>}
              {groups.map((group) => (
                <CommandGroup key={group.type} heading={t(`type.${group.type === "certification" ? "education" : group.type}`)}>
                  {group.hits.map((hit) => (
                    <CommandItem
                      key={hit.id}
                      value={hit.id}
                      onSelect={() => {
                        go(hit.url);
                      }}
                      className="flex flex-col items-start gap-0.5"
                    >
                      <span className="font-medium">{hit.title}</span>
                      {hit.excerpt !== "" && <span className="line-clamp-1 text-xs text-muted-foreground">{hit.excerpt}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}
