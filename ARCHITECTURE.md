# Architecture

See [PRODUCT.md](./PRODUCT.md) for what this is, [DESIGN.md](./DESIGN.md) for the visual system.

## Stack

- **Framework**: Vite 8 running a React 19 SPA + a Nitro 3 server together
- **Language**: TypeScript 5 (strict)
- **Frontend routing**: `vite-plugin-pages` (file-based) + `react-router` 8
- **Backend routing**: Nitro 3 / H3 2 (file-based)
- **Database**: SQLite via Bun's built-in `bun:sqlite` + Drizzle ORM — schema/client in `db/`, migrations in `drizzle/`. Requires the Bun runtime (dev, test, and production — see Deployment below)
- **Styling**: Tailwind CSS v4 (CSS-first, no `tailwind.config.ts`) + `tw-animate-css`
- **UI primitives**: shadcn/ui-style — Radix Slot, `class-variance-authority`, `cn()`
- **Icons**: `lucide-react`, `@heroicons/react`
- **Auto-imports**: `unplugin-auto-import` — `react` + `react-router` need no import
- **Fonts**: `unplugin-fonts` (config in `configs/fonts.config.ts`)
- **Tests**: Vitest + Testing Library (unit/integration/UI), Playwright (E2E/smoke)
- **Lint/format**: ESLint 9 + typescript-eslint, Prettier, Husky + lint-staged

## Directory structure

```
.
├── src/
│   ├── components/ui/   # shadcn/ui-style primitives (+ *.test.tsx)
│   ├── components/shell/ # AppShell, GlobalNav, primary-area list, Empty/Error/Loading frames
│   ├── pages/            # Frontend routes, file-based (+ *.test.tsx)
│   ├── locales/          # Per-locale screen text definitions + registry + resolveScreen
│   ├── hooks/, utils/, types/, constants/, data/, store/
│   ├── test/              # Vitest setup
│   ├── index.css           # Tailwind v4 + design tokens
│   └── main.tsx
├── shared/                # Code imported by BOTH the SPA and the server (e.g. shared/i18n/)
├── routes/api/            # Backend routes, file-based (+ *.test.ts)
├── middleware/             # Runs before every route handler, in file-name order
├── services/               # Server-side domain helpers called by routes (e.g. services/locale.ts)
├── db/                      # Drizzle schema.ts + client.ts (sqlite connection, migrate, seed)
├── drizzle/                  # Generated SQL migrations (drizzle-kit generate), committed
├── e2e/                     # Playwright specs + global-setup.ts
├── configs/, scripts/
├── server.ts                # Nitro server entry
├── vite.config.ts, vitest.config.ts, playwright.config.ts, drizzle.config.ts
├── tsconfig.json             # src + shared
├── tsconfig.node.json          # server/config/test files + shared
└── package.json
```

## Routing

**Frontend**: `src/pages/**/*.tsx` → routes (`about.tsx` → `/about`, `[id].tsx` → `/:id`, `[...all].tsx` → catch-all). `*.test.tsx` excluded via `Pages({ exclude })` in `vite.config.ts`.

**Backend**: `routes/api/*.ts` → `/api/*`, `middleware/*.ts` runs first and can set `event.context`. Requires `nitro({ serverDir: "./" })` in `vite.config.ts` — default is `false` (no scanning). `*.test.ts` excluded via `nitro({ ignore })`. Nitro runs `middleware/` files in file-name order, so a numeric prefix fixes the order: `00.encoding.ts` (UTF-8 request decoding) runs before `10.session.ts` (server-owned session, including the shopper's locale) and before any sign-on or route handler.

**Site shell**: `src/main.tsx` mounts one `AppShell` (header, global navigation rail, main, footer) around every route, so a page renders only its own content. Area routes (`/petstore/**`, `/admin/**`, `/supplier/**`) are `vite-plugin-pages` parent-route files that render `<Outlet />` and may fill the shell's header slot. The global navigation and the landing page both read the primary-area list in `src/components/shell/areas.ts`. Spec: `openspec/specs/site-shell/` once change `swhr2-i-0002-bootstrap-landing-page-and` archives.

**Localization**: a storefront screen takes its text and layout from a per-locale definition in `src/locales/<locale>/`, looked up through `src/locales/resolveScreen.ts` (request `locale` parameter over the session locale, then en_US fallback, then a "Definition for screen <name> not found" error). Locale codes, number/money formatting and word splitting live once in `shared/i18n/` for both sides; server routes pick localized catalog rows through `services/locale.ts`. Spec: `openspec/specs/localization/` once change `swhr2-i-0003-localization` archives.

**Page data states**: a data-driven page loads through `src/hooks/useApi.ts` (`{ data, error, loading, retry }`) and maps the three states onto the shared `LoadingFrame`, `ErrorFrame` (with retry) and `EmptyFrame`.

## Data flow example

`GET /api/hello`: `middleware/auth.ts` sets `event.context.user` → `routes/api/hello.ts` reads it and responds. `routes/api/users/[id].ts` shows the dynamic-route + `createError()` 404 pattern, backed by a real query against `db/client.ts`'s Drizzle instance.

## Database

`db/schema.ts` defines Drizzle tables; `db/client.ts` opens the SQLite connection, runs pending migrations from `drizzle/`, and seeds two demo users and a sample catalog if the tables are empty. Routes import `db` and the table objects directly (see `routes/api/users/`), or call a `services/` helper when the query is domain logic (`services/catalog.ts`, `services/cart.ts`).

- Catalog: `catalog_categories` → `catalog_products` → `catalog_items`, each with a `*_details` table keyed by `(id, locale)` that holds the localized name, description, attributes and (for items) price in major units. A lookup reads the details row for exactly the requested locale; there is no cross-locale fallback.
- Session and cart are in memory, not in SQLite: `middleware/10.session.ts` keys a `{ id, locale }` session by cookie, and the session-only cart lists its lines in the cart's locale (en_US when none is set).

- `bun run db:generate` — after editing `db/schema.ts`, generates a new migration into `drizzle/` (via `drizzle-kit`, config in `drizzle.config.ts`)
- `bun run db:studio` — browse the db in Drizzle Studio
- The db file itself is `sqlite.db` at the project root (gitignored, created on first run); `drizzle/` migrations are committed
- Under Vitest (`VITEST=true`), `db/client.ts` swaps in an in-memory db instead, so tests never touch the dev database

## Testing

Four tiers, one worked example each. Commands and how to extend: [README.md](./README.md#testing), [AGENTS.md](./AGENTS.md).

## Deployment

- `ecosystem.config.js` (PM2) runs the real build: `.output/server/index.mjs`, under Bun (`interpreter: "bun"`) — required by `db/client.ts`'s `bun:sqlite` import. `nitro.service` (systemd) is the non-PM2 equivalent, same requirement.
- `Dockerfile`/`docker-compose.yml` build a static `dist/` served by nginx — don't rely on them for the Nitro/DB-backed API without fixing first (they never run `.output/server/index.mjs`)

## Key Decisions

- **One shell, mounted once at the app root.** Every page renders inside the single `AppShell` in `src/main.tsx`. A capability adds content or fills the header slot, and never draws its own header, navigation or footer. Rationale: `/`, `/about` and the not-found route must carry the same frame as the area routes. Authored in change `swhr2-i-0002-bootstrap-landing-page-and` (design.md, Planning decision P1).
- **One global navigation fed by one area list.** A new primary area is one entry in `src/components/shell/areas.ts`, which both the navigation and the landing page read, never a second menu. Rationale: the navigation and landing links stay in step. Authored in change `swhr2-i-0002-bootstrap-landing-page-and` (design.md, P3).
- **Shared state frames for every data page.** Pages load through `useApi` and render `LoadingFrame` / `ErrorFrame` / `EmptyFrame` instead of bespoke loading, error or empty markup. Capability-specific wording is passed in as the frame's message. Rationale: every screen fails and empties the same way. Authored in change `swhr2-i-0002-bootstrap-landing-page-and` (design.md, Decisions).
- **Screen text comes from per-locale definitions, never page literals.** A new storefront screen adds one definition per supported locale under `src/locales/` and renders through `resolveScreen`; missing locales fall back to en_US. Rationale: the page-locale fallback rules stay in one resolver. Authored in change `swhr2-i-0003-localization` (design.md, Target design).
- **Code needed on both sides lives in `shared/`.** Both tsconfig projects include it; neither `src/` nor the server keeps a second copy. Rationale: the legacy store had four diverging copies of its locale parser. Authored in change `swhr2-i-0003-localization` (design.md, Components).
- **Request decoding runs first.** `middleware/00.encoding.ts` decodes every request as UTF-8 before the session middleware, sign-on or any handler reads a value; new middleware takes a prefix after it. Rationale: non-ASCII credentials must arrive decoded at sign-on. Authored in change `swhr2-i-0003-localization` (design.md, Components).
