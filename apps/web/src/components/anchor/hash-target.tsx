"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Set on the element the URL fragment points at (see the deep-link rules in globals.css). */
const ATTRIBUTE = "data-anchor-hit";

/**
 * Marks the element the current URL fragment names, so it gets the same
 * highlight as `:target`. The browser only updates `:target` on a real
 * fragment navigation; client-side navigations (next/link pushes history
 * entries) and the copy-link button (history.replaceState) never do. Marking
 * the element again restarts its highlight.
 */
export function markAnchorTarget(): void {
  for (const element of document.querySelectorAll(`[${ATTRIBUTE}]`)) element.removeAttribute(ATTRIBUTE);
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (id === "") return;
  const element = document.getElementById(id);
  // Only shareable elements glow; the skip link's #content target does not.
  if (element === null || !element.hasAttribute("data-anchor")) return;
  // A linked entry folded in a <details> (the /now archive) opens, and so does any it sits in.
  for (let details = element.closest("details"); details !== null; details = details.parentElement?.closest("details") ?? null) {
    details.open = true;
  }
  // A reflow between removing and setting the attribute restarts the animation.
  element.getBoundingClientRect();
  element.setAttribute(ATTRIBUTE, "");
}

/**
 * Follows the URL fragment across navigations. Next.js scrolls to the element
 * itself after a client-side navigation to `/page#id`; this only marks it.
 */
export function HashTarget() {
  const pathname = usePathname();
  useEffect(() => {
    markAnchorTarget();
    // Same-page fragment links without a pathname change: native ones fire hashchange; next/link only
    // pushes a history entry, which the Navigation API reports where it exists.
    let last = window.location.href;
    const onEntryChange = () => {
      const href = window.location.href;
      if (href === last) return;
      const hashChanged = href.split("#")[1] !== last.split("#")[1];
      last = href;
      if (hashChanged) markAnchorTarget();
    };
    const navigation = (window as { navigation?: EventTarget }).navigation;
    window.addEventListener("hashchange", markAnchorTarget);
    navigation?.addEventListener("currententrychange", onEntryChange);
    return () => {
      window.removeEventListener("hashchange", markAnchorTarget);
      navigation?.removeEventListener("currententrychange", onEntryChange);
    };
  }, [pathname]);
  return null;
}
