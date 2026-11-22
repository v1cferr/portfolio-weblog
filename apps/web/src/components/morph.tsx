import { type ReactNode, ViewTransition } from "react";

/** The kinds of things that have a list entry and a page of their own. */
export type MorphKind = "project" | "experience" | "post";

/** A view-transition name is a CSS identifier: anything else becomes "_". */
export function morphName(kind: MorphKind, id: string) {
  return `${kind}-${id.replace(/[^\w-]/g, "_")}`;
}

/**
 * Marks one element as the same thing on two pages (a card's title, the
 * detail page's title), so navigating between them morphs one into the other
 * instead of swapping. The morph class is styled in globals.css.
 *
 * A name must be unique on the page: where an entity shows up twice (a
 * featured card and its timeline row), only one of them passes `enabled`.
 * `default="none"` keeps it still on every transition it is not part of.
 */
export function Morph({ kind, id, enabled = true, children }: { kind: MorphKind; id: string; enabled?: boolean; children: ReactNode }) {
  if (!enabled) return children;
  return (
    <ViewTransition name={morphName(kind, id)} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
