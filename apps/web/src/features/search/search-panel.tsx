"use client";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { type SearchDocument, type SearchEntityType, searchOptions } from "@workspace/search/options";
import MiniSearch from "minisearch";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useRouter } from "@/i18n/navigation";

type Hit = Pick<SearchDocument, "id" | "entityId" | "type" | "title" | "url" | "excerpt">;
type State = { status: "loading" | "error" } | { status: "ready"; index: MiniSearch<SearchDocument> };

const GROUP_ORDER: SearchEntityType[] = ["experience", "project", "post", "education", "certification", "technology"];

/**
 * The search dialog itself. Loaded only after the first open (see
 * search-dialog.tsx), then fetches the static per-locale corpus once and runs
 * every query in the browser.
 */
export default function SearchPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Search");
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
  );
}
