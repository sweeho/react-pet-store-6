# Design System

See [PRODUCT.md](./PRODUCT.md) for what this is, [ARCHITECTURE.md](./ARCHITECTURE.md) for how it's built.

## Tokens

OKLCH custom properties in `src/index.css` (`:root` light, `.dark` dark), mapped to Tailwind utilities via `@theme inline`. Add a token in both places + the theme block, or Tailwind won't generate a class for it.

| Token                                                | Tailwind class                                       |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `--background` / `--foreground`                      | `bg-background` / `text-foreground`                  |
| `--primary` / `--secondary` / `--muted` / `--accent` | `bg-*`                                               |
| `--destructive`                                      | `bg-destructive`                                     |
| `--border` / `--input` / `--ring`                    | `border-border` / `border-input` / `outline-ring/50` |
| `--radius` (+ `sm`/`md`/`lg`/`xl`)                   | `rounded-*`                                          |

### Palette

The Pet Store uses an indigo brand on a slate neutral ramp. Light-theme values (hex is the source; store the OKLCH equivalent in `src/index.css`):

| Role                     | Token                                      | Value     |
| ------------------------ | ------------------------------------------ | --------- |
| Brand / primary action   | `--primary` (`--primary-foreground` white) | `#4f46e5` |
| Focus ring               | `--ring`                                   | `#4f46e5` |
| Page background          | `--background`                             | `#ffffff` |
| Raised surface, nav rail | `--muted` / `--secondary`                  | `#f8fafc` |
| Body text                | `--foreground`                             | `#0f172a` |
| Secondary text           | `--muted-foreground`                       | `#64748b` |
| Borders, dividers        | `--border` / `--input`                     | `#e2e8f0` |
| Error                    | `--destructive`                            | `#dc2626` |

Success `#16a34a`, warning `#d97706` and info `#0284c7` are status colours for badges and inline messages; add them as tokens the first time a component needs one.

The light-mode `--destructive-foreground` must contrast with `--destructive` (it once duplicated it, making text invisible).

## Typography

Inter (loaded through `configs/fonts.config.ts`) for all UI text, `ui-monospace` for codes and ids. Body 14px/20px; section headings 16px semibold; page titles one level-1 heading per page.

## Layout — the site shell

Every page renders inside one shell (`src/components/shell/AppShell.tsx`, see [ARCHITECTURE.md](./ARCHITECTURE.md#key-decisions)):

- A CSS grid of two columns, **240px navigation rail + fluid content**, and three rows, **56px header, content, 40px footer**.
- The **header** spans both columns: store name linking to `/`, then a slot a capability may fill (search box, language switch, cart, sign-in state).
- The **global navigation** is the left rail: a Home link first, then one entry per primary area grouped under small uppercase group labels (Shop, Account, Store staff). The active entry carries `aria-current="page"` and the brand colour.
- **Content** sits in `<main>` with 24px/32px padding. Pages draw content only — never their own header, navigation or footer.
- The **footer** sits under the content column: muted 12px text with the store name and the change-language link.

## State frames

Three shared frames (`src/components/shell/`) are the only way a page shows a non-content state. Each is a centred block in the content area: a round icon badge, a 16px semibold heading, one muted sentence, then actions.

- **Empty** — says there is nothing to show and what to do next; actions are links (primary button + secondary link). The capability passes its own message.
- **Error** — states that the page could not load, reassures that nothing was lost, and offers **Try again** (primary) and Back to home. The icon and label use `--destructive`.
- **Loading** — `role="status"` with a short label; skeleton rows use `--border` as their fill.

## Accessibility

Landmarks on every page: one `banner`, one `navigation` labelled "Global", one `main`, one `contentinfo`. Every interactive element shows a visible focus ring (`outline-ring`, 2px, offset 2px). A control's accessible name contains its visible label.

## Components

Pattern (see `src/components/ui/button.tsx` + `button-variants.ts`):

- Variants via `class-variance-authority`
- Class merging via `cn()` (`clsx` + `tailwind-merge`) — always last, so callers can override
- Polymorphism via Radix `Slot` (`asChild` prop)
- Variants exported from a separate `*-variants.ts` file, not the component file (avoids an `eslint-plugin-react-refresh` warning)

New shared primitives go in `src/components/ui/`, shell chrome and state frames in `src/components/shell/`; both follow this pattern and get a `*.test.tsx`.

## Theming

Dark-mode tokens exist but no toggle is wired up — nothing sets `.dark` on `<html>` yet.

## Icons

`lucide-react` for general use, `@heroicons/react` for `@headlessui/react` overlays.

## Animation

`tw-animate-css` — Tailwind v4-compatible successor to `tailwindcss-animate`.
