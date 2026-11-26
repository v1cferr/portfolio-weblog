"use client";

import { Button } from "@workspace/ui/components/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Spinner } from "@workspace/ui/components/spinner";
import { type SearchDocument, type SearchEntityType, searchOptions } from "@workspace/search/options";
import { XIcon } from "lucide-react";
import MiniSearch from "minisearch";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useDelayed } from "@/hooks/use-delayed";
import { useRouter } from "@/i18n/navigation";

type Hit = Pick<SearchDocument, "id" | "entityId" | "type" | "title" | "url" | "excerpt">;
type State = { status: "loading" | "error" } | { status: "ready"; index: MiniSearch<SearchDocument> };

const GROUP_ORDER: SearchEntityType[] = [
  "experience",
  "project",
  "post",
  "education",
  "certification",
  "recommendation",
  "technology",
  "page",
];

/**
 * The search dialog itself: instant results over the static per-locale
 * corpus, all in the browser. The profile chat lives in its own dock
 * (features/ask). Loaded only after the first open (see search-dialog.tsx).
 * Full screen on phones, a centred panel from `sm` up.
 */
export default function SearchPanel({
  open,
  onOpenChange,
  initialQuery,
  returnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Typed in when the dialog opens, e.g. the question the Ask dock could not answer. */
  initialQuery: string;
  /** The element that opened the dialog, focused again when it closes. */
  returnFocus: HTMLElement | null;
}) {
  const t = useTranslations("Search");
  const ask = useTranslations("Ask");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [seen, setSeen] = useState({ open, initialQuery });

  // Each opening starts from the query it was opened with.
  if (seen.open !== open || seen.initialQuery !== initialQuery) {
    setSeen({ open, initialQuery });
    if (open) setQuery(initialQuery);
  }
  const [state, setState] = useState<State>({ status: "loading" });
  // The index usually loads in a blink; only a slow one shows the spinner.
  const slow = useDelayed(state.status === "loading");

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
        // Focus the search box, not the close button: typing starts at once.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
          target?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
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
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("hint")}</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} className="min-h-0 flex-1 rounded-none! [&_[cmdk-input-wrapper]]:border-b">
          <div className="flex items-center gap-1 border-b pr-2 [&_[data-slot=command-input-wrapper]]:flex-1 [&_[data-slot=command-input-wrapper]]:p-2">
            <CommandInput value={query} onValueChange={setQuery} placeholder={t("placeholder")} data-autofocus />
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="size-11 shrink-0 sm:size-9" aria-label={ask("close")}>
                <XIcon />
              </Button>
            </DialogClose>
          </div>
          <CommandList className="max-h-none flex-1 sm:max-h-[60vh]">
            {slow && (
              <p role="status" className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Spinner aria-hidden role="presentation" />
                {t("loading")}
              </p>
            )}
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
