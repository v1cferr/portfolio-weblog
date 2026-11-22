import { type ReactNode, ViewTransition } from "react";

/*
 * Navigation types, set on links with `transitionTypes`. Which way a link goes
 * is a decision about the site's hierarchy, so each link states it:
 * - forward: from a list to one of its entries (slides left);
 * - back: from an entry to its list (slides right).
 * Navigations without a type (browser back, refreshes, sideways links) swap the
 * page with no movement; titles still morph where they match.
 */
export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];

const BY_TYPE = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
};

/**
 * Wraps a page's content so it animates in and out by navigation type (CSS in
 * globals.css). It belongs in each page.tsx, not a layout: layouts persist
 * across navigations, so they never enter or exit.
 */
export function PageTransition({
  as: Element = "div",
  className,
  children,
}: {
  /** The page's outer element; detail pages are an article. */
  as?: "div" | "article";
  className?: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition enter={BY_TYPE} exit={BY_TYPE} default="none">
      <Element className={className}>{children}</Element>
    </ViewTransition>
  );
}
