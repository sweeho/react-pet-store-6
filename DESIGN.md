# Design System

See [PRODUCT.md](./PRODUCT.md) for what this is, [ARCHITECTURE.md](./ARCHITECTURE.md) for how it's built.

## Tokens

CSS custom properties in `src/index.css` (`:root` light, `.dark` dark), mapped to Tailwind utilities via `@theme inline`. Add a token in both places + the theme block, or Tailwind won't generate a class for it.

The Pet Store palette (the project design guide, as used by the site-shell mockups):

| Role                   | Value     | Token → Tailwind class                                |
| ---------------------- | --------- | ----------------------------------------------------- |
| Brand / primary action | `#4f46e5` | `--brand` → `bg-brand`, `text-brand`, `outline-brand` |
| On brand               | `#ffffff` | `--brand-foreground` → `text-brand-foreground`        |
| Page background        | `#ffffff` | `--background` → `bg-background`                      |
| Surface (rail, bars)   | `#f8fafc` | `--surface` → `bg-surface`                            |
| Text                   | `#0f172a` | `--foreground` → `text-foreground`                    |
| Muted text             | `#64748b` | `--muted-foreground` → `text-muted-foreground`        |
| Border                 | `#e2e8f0` | `--border` / `--input` → `border-border`              |
| Danger / error         | `#dc2626` | `--danger` → `text-danger`, `bg-danger`               |
| Focus ring             | brand     | `--ring` → `outline-ring`                             |

The shadcn tokens (`--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--radius` + `sm`/`md`/`lg`/`xl`) remain for `src/components/ui/` primitives.

## Type

Inter (loaded through `unplugin-fonts`, `configs/fonts.config.ts`) is the sans family (`--font-sans`), falling back to `system-ui`. JetBrains Mono is for code and ids. Body text is 14px; the page title (`h1`) is the only level-1 heading on a page.

## Layout — the site shell

Every page renders inside one shell (`src/components/shell/AppShell.tsx`, see ARCHITECTURE.md §Site shell). Its grid:

- **Header**: 56px, full width; brandmark "Pet Store" linking home, then slots that capabilities fill (search, language, cart, account).
- **Navigation rail**: 240px, left, `bg-surface` with a right border. Starts with Home and is grouped into Shop, Account, Administration and Supplier. The active item uses brand text on a tinted background and carries `aria-current="page"`.
- **Main**: the remaining width; the only region that scrolls.
- **Footer**: 40px, muted text.

Below the `md` breakpoint the rail stacks above main and stays visible.

## State frames

Pages never draw their own empty, error or loading UI; they use the shared frames in `src/components/shell/`:

- **EmptyFrame**: icon, title, a message saying what to do next, and optional actions. A capability passes its own copy (e.g. "Your Shopping Cart is Empty.").
- **ErrorFrame**: `role="alert"`, a "Couldn't load" eyebrow, title and message, a primary **Retry** button and an optional "Back to home" link.
- **LoadingFrame**: `role="status"`, a spinner with a text label (default "Loading…"). The spinner stops under `prefers-reduced-motion`.

## Accessibility

- Landmarks: exactly one `banner`, `navigation` (labelled "Global"), `main` and `contentinfo` per page.
- Every interactive element shows a visible `focus-visible` outline in the brand colour; never remove it without a replacement.
- A control's accessible name contains its visible label (WCAG 2.5.3).
- Text and token pairs above meet WCAG AA contrast on their intended background.

## Theming

Dark-mode tokens exist but no toggle is wired up; nothing sets `.dark` on `<html>`. A theme switch is out of scope.

## Components

Pattern (see `src/components/ui/button.tsx` + `button-variants.ts`):

- Variants via `class-variance-authority`
- Class merging via `cn()` (`clsx` + `tailwind-merge`), always last, so callers can override
- Polymorphism via Radix `Slot` (`asChild` prop)
- Variants exported from a separate `*-variants.ts` file, not the component file (avoids an `eslint-plugin-react-refresh` warning)

New shared primitives go in `src/components/ui/`; shell chrome and state frames go in `src/components/shell/`. Both follow this pattern and get a `*.test.tsx`.

## Icons

`lucide-react` for general use (shell, frames), `@heroicons/react` for `@headlessui/react` overlays.

## Animation

`tw-animate-css`, the Tailwind v4-compatible successor to `tailwindcss-animate`.
