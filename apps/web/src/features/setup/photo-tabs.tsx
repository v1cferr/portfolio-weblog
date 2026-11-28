"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { type ReactNode, useCallback, useLayoutEffect, useState } from "react";

import { PHOTO_PARAM, parsePhoto, urlWithPhoto } from "@/components/lightbox/photo-param";

import { PHOTOS_SECTION, photoTabAnchor, photoTabGallery } from "./photo-tab-ids";

export interface PhotoTab {
  value: string;
  label: string;
  count: number;
  /** The tab's timeline, rendered on the server. */
  panel: ReactNode;
}

/**
 * The setup photos in tabs, one timeline each. Every panel stays mounted (and
 * in the server HTML), so each tab's lightbox answers its own `?photo=` link
 * and the photos are there without JavaScript. The tab follows the URL: a
 * `#setup-photos-<value>` fragment or a `?photo=setup-<value>-<n>` link opens
 * it, and picking a tab puts its fragment in the address bar to be shared.
 *
 * Before the split, the photos were one gallery (`?photo=setup-<n>`, newest
 * first); `legacy` lists, in that old order, where each photo is now, so old
 * links still open the same photo.
 */
export function PhotoTabs({ tabs, legacy }: { tabs: readonly PhotoTab[]; legacy: { gallery: string; photos: readonly string[] } }) {
  const [value, setValue] = useState(tabs[0]?.value ?? "");

  const fromUrl = useCallback((): string | null => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const photo = new URLSearchParams(window.location.search).get(PHOTO_PARAM) ?? "";
    const tab = tabs.find(
      (candidate) => hash === photoTabAnchor(candidate.value) || photo.startsWith(`${photoTabGallery(candidate.value)}-`)
    );
    return tab?.value ?? null;
  }, [tabs]);

  // A layout effect runs before the lightboxes' effects read `?photo=`, so an old link is rewritten first.
  useLayoutEffect(() => {
    const old = parsePhoto(new URLSearchParams(window.location.search).get(PHOTO_PARAM), legacy.gallery, legacy.photos.length);
    const moved = old === null ? undefined : legacy.photos[old];
    if (moved !== undefined) window.history.replaceState(window.history.state, "", urlWithPhoto(moved));

    const select = (scroll: boolean) => {
      const found = fromUrl();
      if (found === null) return;
      setValue(found);
      // The panel was hidden when the browser looked for the fragment, so the scroll happens here,
      // to the section's heading so the tabs show above the timeline.
      if (scroll && window.location.hash === `#${photoTabAnchor(found)}`) {
        requestAnimationFrame(() => document.getElementById(PHOTOS_SECTION)?.scrollIntoView());
      }
    };
    select(true);
    const onHashChange = () => {
      select(true);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [fromUrl, legacy]);

  const change = (next: string) => {
    setValue(next);
    const url = new URL(window.location.href);
    url.hash = photoTabAnchor(next);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <Tabs value={value} onValueChange={change} className="gap-4">
      <TabsList className="w-full sm:w-fit">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="px-3 text-foreground/80">
            {tab.label}
            <span className="font-mono text-xs tabular-nums">{tab.count}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} forceMount className="data-[state=inactive]:hidden">
          <div id={photoTabAnchor(tab.value)}>{tab.panel}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
