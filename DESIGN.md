# Design System

See [PRODUCT.md](./PRODUCT.md) for what this is, [ARCHITECTURE.md](./ARCHITECTURE.md) for how it's built. The approved Pet Store mockups the system is drawn from are exported per sprint under `artifacts/<sprint>/design/`.

## Tokens

Custom properties in `src/index.css` (`:root` light in hex, taken from the Pet Store mockups; `.dark` dark in OKLCH), mapped to Tailwind utilities via `@theme inline`. Add a token in both places + the theme block, or Tailwind won't generate a class for it.

| Token                                        | Tailwind class                                    | Pet Store value (light)                          |
| -------------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `--background` / `--foreground`              | `bg-background` / `text-foreground`               | white / slate-900 (`#0f172a`)                    |
| `--primary` / `--primary-foreground`         | `bg-primary` / `text-primary-foreground`          | brand indigo (`#4f46e5`) / white                 |
| `--secondary` / `--muted` / `--accent`       | `bg-*`                                            | slate-50 surface (`#f8fafc`)                     |
| `--muted-foreground`                         | `text-muted-foreground`                           | slate-500 (`#64748b`)                            |
| `--destructive` / `--destructive-foreground` | `bg-destructive` / `text-destructive-foreground`  | red-600 (`#dc2626`) / white                      |
| `--border` / `--input` / `--ring`            | `border-border` / `border-input` / `outline-ring` | slate-200 (`#e2e8f0`) / slate-200 / brand indigo |
| `--sidebar*`                                 | `bg-sidebar`, …                                   | the navigation rail; slate-50 surface            |
| `--radius` (+ `sm`/`md`/`lg`/`xl`)           | `rounded-*`                                       | 8px controls, 12px cards                         |

## Typography

Inter (400/500/600/700, loaded through `configs/fonts.config.ts`) is the sans font, and the base body size is 14px. Page titles are one `h1` per page (24–32px, semibold), section headings are 16px semibold, and group labels in the navigation rail are 11–12px uppercase muted.

## Layout — the site shell

Every page renders inside one shell (`src/components/shell/AppShell.tsx`; see ARCHITECTURE.md §Routing):

- **Grid at `lg` and up:** a 56px header across the full width, a 240px left navigation rail beside the content well, and a 40px footer. Content scrolls inside the well, not the page.
- **Below `lg`:** the rail collapses behind a menu button in the header and opens as a dialog (`@headlessui/react`).
- **Header:** the brand mark (links to `/`) on the left, then a slot capabilities fill (search, language, cart, sign in or sign out).
- **Navigation rail:** a Home link, then the primary areas grouped under small uppercase headings. The current route is marked with the primary tint. A page never draws its own header, navigation or footer.

## State frames

Three shared frames live in `src/components/shell/`, centred in the content well, each with an icon, a short heading and one line of guidance:

- **Empty** (`EmptyFrame`): says there is nothing to show and offers the next step as a link or button.
- **Error** (`ErrorFrame`): says the page could not load, offers **Try again** as the primary action and Back to home as the secondary, and is announced as an alert.
- **Loading** (`LoadingFrame`): a spinner with a "Loading…" label, announced politely as a status.

Capability-specific wording, such as "Your Shopping Cart is Empty.", is passed in as the frame's message. Do not build a bespoke empty, error or spinner block.

## Accessibility

- Landmarks: exactly one `banner`, one global `navigation`, one `main` and one `contentinfo` per page.
- Every interactive element shows a visible `focus-visible` outline in `--ring`. Never remove an outline without replacing it.
- An accessible name must contain the visible label (WCAG 2.5.3).
- Text meets WCAG AA contrast against its surface, so muted text is used only on white or slate-50.

## Theming

Dark-mode tokens exist but no toggle is wired up, because nothing sets `.dark` on `<html>`. A theme switch is out of scope for the Pet Store.

## Components

Pattern (see `src/components/ui/button.tsx` + `button-variants.ts`):

- Variants via `class-variance-authority`
- Class merging via `cn()` (`clsx` + `tailwind-merge`) — always last, so callers can override
- Polymorphism via Radix `Slot` (`asChild` prop)
- Variants exported from a separate `*-variants.ts` file, not the component file (avoids an `eslint-plugin-react-refresh` warning)

Generic primitives go in `src/components/ui/`; site-shell chrome and the state frames go in `src/components/shell/`. Both follow this pattern and each component gets a `*.test.tsx`.

## Icons

`lucide-react` for general use (navigation rail, state frames), `@heroicons/react` for `@headlessui/react` overlays (the mobile navigation dialog).

## Animation

`tw-animate-css` — Tailwind v4-compatible successor to `tailwindcss-animate`. Motion is limited to the loading spinner and the mobile navigation dialog.
