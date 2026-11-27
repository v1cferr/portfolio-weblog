# 0018. UI state kept per tab, without a state library

- Status: accepted (2026-11-26, chosen by the owner)

## Context

Switching language sent the reader to the top of the page and reset everything
they had opened. The switch is a navigation to another `[locale]` segment, which
remounts the whole page: every `useState` starts over, Next.js scrolls to the
top, the query (`?view=` on /projects, `?photo=`) and the fragment were dropped,
and the focus fell to `<body>`. A reload had the same effect on what was open.

The usual tools for this are a client store (Zustand) for UI state and a
URL-state library (nuqs) for the query. The site has no state shared between
distant components, and the projects catalogue already reads its query by hand
on purpose: `useSearchParams` makes a static page render only a Suspense
fallback. The profile chat (ADR 0011) and the theme already keep their state for
the browser tab and never into the next visit.

## Decision

- **No new library.** State lives in one of three places, by how far it travels:
  the URL for what is shareable, sessionStorage for UI state of the tab, React
  state for passing overlays. Nothing lasts across visits.
- **A `useSessionState` hook** generalizes the chat's pattern: the first render
  is the initial value (the server's HTML, so hydration never mismatches), the
  saved value applies right after through `useSyncExternalStore`, and every
  access is guarded. Keys are `v1c:ui:<path without locale>:<id>`, so the same
  element shares its state in every language. Read all, Show all, the
  `<details>` on /now and in case studies, and the explorer's folders (moved
  from localStorage) use it; info tips, popovers and the search dialog stay
  ephemeral.
- **A language switch keeps the place.** The switcher keeps the query and the
  fragment, navigates without scrolling, and saves the anchored element closest
  above the header with its offset (and the share of the page, as a fallback).
  The new page puts that element back at the same height, instantly, corrects
  for late layout shifts until the reader moves, does not highlight the fragment
  again, and gives the focus back to the switcher.

## Consequences

- A reload or a language switch keeps what the reader opened; a new tab starts
  from the defaults, like the theme and the chat.
- Elements need a language-independent `stateId`; post headings, whose ids come
  from translated text, fall back to the share of the page.
- The restore corrects the scroll for up to 1.5 s after a switch; any scroll,
  key or touch by the reader stops it at once.
- Revisit with a new record if the site gains real client state, read and
  written by many components (a cart, a draft, a signed-in user). See
  [the guide](../guides/ui-state.md).
