"use client";

import { Button } from "@workspace/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { type SearchDocument, type SearchEntityType, searchOptions } from "@workspace/search/options";
import { SearchIcon, SparklesIcon, XIcon } from "lucide-react";
import MiniSearch from "minisearch";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useRouter } from "@/i18n/navigation";

import { AskPanel } from "./ask-panel";

export type PanelMode = "search" | "ask";

type Hit = Pick<SearchDocument, "id" | "entityId" | "type" | "title" | "url" | "excerpt">;
type State = { status: "loading" | "error" } | { status: "ready"; index: MiniSearch<SearchDocument> };

const GROUP_ORDER: SearchEntityType[] = ["experience", "project", "post", "education", "certification", "technology", "page"];

/**
 * The search dialog itself, with two tabs: Search (instant results over the
 * static per-locale corpus, all in the browser) and Ask (the profile chat,
 * ADR 0011). Loaded only after the first open (see search-dialog.tsx). Full
 * screen on phones, a centred panel from `sm` up.
 */
export default function SearchPanel({
  open,
  onOpenChange,
  mode,
  onModeChange,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PanelMode;
  onModeChange: (mode: PanelMode) => void;
  /** The element that opened the dialog, focused again when it closes. */
  returnFocus: HTMLElement | null;
}) {
  const t = useTranslations("Search");
  const ask = useTranslations("Ask");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/search/${locale}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
        return response.json() as Promise<SearchDocument[]>;
      })
      .then((docs) => {
        const index = new MiniSearch<SearchDocument>(searchOptions);
        index.addAll(docs);
        if (!cancelled) setState({ status: "ready", index });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const groups = useMemo(() => {
    if (state.status !== "ready" || query.trim().length < 2) return [];
    const hits = state.index.search(query).slice(0, 20) as unknown as Hit[];
    return GROUP_ORDER.map((type) => ({ type, hits: hits.filter((hit) => hit.type === type) })).filter((group) => group.hits.length > 0);
  }, [state, query]);

  function go(url: string) {
    onOpenChange(false);
    // Search URLs carry the locale prefix; the i18n router adds its own.
    router.push(url.replace(new RegExp(`^/${locale}`), "") || "/");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // Focus the active tab's input, not the first tab: typing starts at once.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
          target?.querySelector<HTMLElement>("[data-state=active] [data-autofocus]")?.focus();
        }}
        // The dialog has no Radix trigger, so focus goes back to whatever opened it.
        onCloseAutoFocus={(event) => {
          if (returnFocus?.isConnected !== true) return;
          event.preventDefault();
          returnFocus.focus();
        }}
        className="flex flex-col gap-0 overflow-hidden p-0 sm:max-h-[min(42rem,85dvh)] sm:max-w-xl max-sm:inset-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:ring-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{mode === "ask" ? ask("title") : t("title")}</DialogTitle>
          <DialogDescription>{mode === "ask" ? ask("description") : t("hint")}</DialogDescription>
        </DialogHeader>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            onModeChange(value as PanelMode);
          }}
          className="min-h-0 flex-1 gap-0"
        >
          <div className="flex items-center gap-2 border-b p-2">
            <TabsList aria-label={ask("modes")} className="h-auto! flex-1 sm:flex-none">
              <TabsTrigger value="search" className="min-h-11 min-w-24 px-3 text-muted-foreground sm:min-h-8">
                <SearchIcon aria-hidden />
                {ask("searchTab")}
              </TabsTrigger>
              <TabsTrigger value="ask" className="min-h-11 min-w-24 px-3 text-muted-foreground sm:min-h-8">
                <SparklesIcon aria-hidden />
                {ask("tab")}
              </TabsTrigger>
            </TabsList>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="ml-auto size-11 sm:size-9" aria-label={ask("close")}>
                <XIcon />
              </Button>
            </DialogClose>
          </div>
          <TabsContent value="search" className="flex min-h-0 flex-col">
            <Command shouldFilter={false} className="rounded-none! [&_[cmdk-input-wrapper]]:border-b">
              <CommandInput value={query} onValueChange={setQuery} placeholder={t("placeholder")} data-autofocus />
              <CommandList className="max-h-none flex-1 sm:max-h-[60vh]">
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
          </TabsContent>
          {/* Kept mounted while hidden, so a conversation survives a look at the Search tab. */}
          <TabsContent value="ask" forceMount className="flex min-h-0 flex-col data-[state=inactive]:hidden">
            <AskPanel
              onNavigate={() => {
                onOpenChange(false);
              }}
              onSearch={(question) => {
                setQuery(question);
                onModeChange("search");
                // Once the Search tab has mounted, continue in its input.
                requestAnimationFrame(() => {
                  document.querySelector<HTMLElement>("[data-slot=dialog-content] [data-state=active] [data-autofocus]")?.focus();
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
