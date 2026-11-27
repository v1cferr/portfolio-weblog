# Keep UI state

Where each kind of state lives on the site, and how to keep a new piece of UI as
the reader left it. The why is in
[ADR 0018](../decisions/0018-per-tab-ui-state.md).

## Where state lives, by how far it travels

| State                         | Lives in                        | Lasts                                         | Examples                                                 |
| ----------------------------- | ------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Shareable: a view of the page | The URL (query or fragment)     | Forever, in any link                          | `?view=` and `?tech=` on /projects, `?photo=`, `#ids`    |
| UI: what is open or folded    | sessionStorage, under `v1c:ui:` | The browser tab: reloads and language changes | Read all, Show all, `<details>`, explorer folders        |
| Ephemeral: a passing overlay  | React state                     | Until it closes or the page changes           | Info tips, popovers, menus, the search dialog            |
| Across visits                 | Nothing                         | Never                                         | A new tab or a new visit always starts from the defaults |

The theme and the chat dock follow the same per-tab rule with their own keys
(`hub-theme-session`, `v1c:ask:*`).

## Keep a disclosure open for the tab

In a server component, use the wrappers in `components/session-disclosure.tsx`
in place of a bare shadcn `Collapsible` or a `<details>`:

```tsx
<SessionCollapsible stateId={`read-all:${item.id}`}>…</SessionCollapsible>
<SessionDetails stateId={`decision:${String(index)}`} defaultOpen={index === 0}>…</SessionDetails>
```

`stateId` names the element on its page and must not depend on the language (use
content ids or positions, never translated text), so the same element shares its
state in every locale.

In a client component, call the hook directly:

```tsx
const [open, setOpen] = usePageSessionState("show-more:uncurated", false);
// Site-wide rather than per page:
const [folders, setFolders] = useSessionState<Record<string, boolean>>(
  "explorer:open",
  {}
);
```

Keys are `v1c:ui:<path without locale>:<id>` for page state and `v1c:ui:<scope>`
for site-wide state (`lib/ui-state.ts`). Values are JSON; one of another type
than the initial value is ignored.

The first render is always the initial value, the same HTML the server sent, so
hydration never mismatches; the saved value applies in the commit right after,
before the browser paints. Blocked storage (private windows, a full quota) keeps
the state in memory until a reload.

## The language switch

The switch keeps the page, its query and its fragment, and the reader's place:

1. Before navigating, the switcher (`components/shell/locale-switcher.tsx`)
   saves one `v1c:ui:locale-switch:place` entry: the anchored element closest
   above the header line (`[data-anchor][id]`, or a section or heading with an
   id in `main`), its distance from the top of the viewport, and how far down
   the page the reader was.
2. It navigates with `scroll: false`, so neither Next.js nor the browser sends
   the reader to the top.
3. The `ScrollKeeper` in the layout (`components/anchor/scroll-keeper.tsx`)
   reads the entry once, deletes it and, on the same page, puts the same element
   back at the same height, instantly. It corrects on every frame for a moment,
   since a restored disclosure or a late image can move it, and stops as soon as
   the reader scrolls, types or touches. Without the element (post headings take
   their ids from translated text) it falls back to the same share of the page.
4. The fragment does not glow again, and the focus returns to the switcher.

## Tests

- `apps/web/test/ui-state.test.ts`: the key scheme, parsing and the choice of
  the anchor element.
- `apps/web/e2e/ui-state.spec.ts`: the place, the query and the fragment survive
  a switch; Read all and the case-study decisions survive a switch and a reload;
  a new tab starts folded; the focus is back on the switcher.

## When to revisit

The site has no real client state today: nothing is shared between distant
components, nothing is edited, and the URL already carries what is shareable. A
store (Zustand) or a URL-state library (nuqs) would add a dependency to solve
problems the site does not have, and both need the same hydration workaround the
hook already does. Revisit when the site gains state that many components read
and write (a cart, a draft, a signed-in user), and record the change in a new
ADR.
