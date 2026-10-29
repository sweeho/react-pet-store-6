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

**Sessions and access control**: `middleware/10.session.ts` attaches one in-memory session per area from `services/session/store.ts`, chosen by path and cookie: `/api/admin/**` → `admin_sid`, `/api/supplier/**` → `supplier_sid`, everything else → `ps_sid` (storefront). Each area has its own idle limit (storefront 15 minutes, administration 54), after which the session and its cart are dropped and a fresh one is issued. Storefront customers are checked against hashed passwords in `signon_users`; administration and supplier users against operator configuration (see Deployment). A route that needs a signed-on user calls a guard from `services/session/guards.ts` (`requireCustomer`, `requireAdmin`, `requireSupplier`), which answers 401 otherwise; the SPA answers a storefront 401 by sending the visitor to `/petstore/signin` and back. In-process services (message hand-off, order lines) have no route and no role check of their own: the route that calls them decides. Spec: `openspec/specs/sign-on/` once change `swhr2-i-0005-sign-on-and-access-control` archives.

**Page data states**: a data-driven page loads through `src/hooks/useApi.ts` (`{ data, error, loading, retry }`) and maps the three states onto the shared `LoadingFrame`, `ErrorFrame` (with retry) and `EmptyFrame`.

## Data flow example

`GET /api/hello`: `middleware/auth.ts` sets `event.context.user` → `routes/api/hello.ts` reads it and responds. `routes/api/users/[id].ts` shows the dynamic-route + `createError()` 404 pattern, backed by a real query against `db/client.ts`'s Drizzle instance.

## Database

`db/schema.ts` defines Drizzle tables; `db/client.ts` opens the SQLite connection with foreign keys enforced (`PRAGMA foreign_keys = ON`), runs pending migrations from `drizzle/`, and seeds two demo users and a sample catalog if the tables are empty. Routes import `db` and the table objects directly (see `routes/api/users/`), or call a `services/` helper when the query is domain logic (`services/catalog/`, `services/cart.ts`).

- Catalog: `catalog_categories` → `catalog_products` → `catalog_items`, each with a `*_details` table keyed by `(id, locale)` that holds the localized name, description, attributes and (for items) list price and unit cost. Parent references are foreign keys. `services/catalog/` is the only reader of these tables: an item is visible in a locale only where both it and its product have details there, there is no cross-locale fallback, and a store failure surfaces as `CatalogError` (500), never as an empty list. Spec: `openspec/specs/catalog-browsing/` once change `swhr2-i-0004-catalog-browsing-and-search` archives.
- Money is stored as integers in hundredths of the displayed unit in every locale (16.50 → 1650, ¥1951 → 195100); code divides by 100 only when it hands a value to `shared/i18n/format.ts#formatMoney`.
- Catalog list reads (categories, a category's products, a product's items) are served through an in-process 5-minute cache shared by all shoppers; item detail and search are always read live.
- Sign-on: `signon_users` holds one row per storefront user id with an argon2id `password_hash` (`Bun.password`); customer records hang off it. Administration and supplier users are not in the database.
- Session and cart are in memory, not in SQLite: an area session (`area`, `locale`, `userId`, `lastSeen`) is keyed by its area cookie, and the session-only cart, keyed by session id, lists its lines in the cart's locale (en_US when none is set).

- `bun run db:generate` — after editing `db/schema.ts`, generates a new migration into `drizzle/` (via `drizzle-kit`, config in `drizzle.config.ts`)
- `bun run db:studio` — browse the db in Drizzle Studio
- The db file itself is `sqlite.db` at the project root (gitignored, created on first run); `drizzle/` migrations are committed
- Under Vitest (`VITEST=true`), `db/client.ts` swaps in an in-memory db instead, so tests never touch the dev database

## Testing

Four tiers, one worked example each. Commands and how to extend: [README.md](./README.md#testing), [AGENTS.md](./AGENTS.md).

## Deployment

- `ecosystem.config.js` (PM2) runs the real build: `.output/server/index.mjs`, under Bun (`interpreter: "bun"`) — required by `db/client.ts`'s `bun:sqlite` import. `nitro.service` (systemd) is the non-PM2 equivalent, same requirement.
- The server runs as exactly one process (`instances: 1`): the area session store, the cart and the catalog page cache live in that process's memory. Scaling out needs a shared store for all three first.
- Administration and supplier credentials come from the environment: `ADMIN_USERS` and `SUPPLIER_USERS`, each a comma-separated list of `userId:passwordHash` (argon2id, `Bun.password.hash`). Unset means nobody can sign in to that area; there is no built-in account. The Playwright configs pass test values to their dev server.
- `Dockerfile`/`docker-compose.yml` build a static `dist/` served by nginx — don't rely on them for the Nitro/DB-backed API without fixing first (they never run `.output/server/index.mjs`)

## Key Decisions

- **One shell, mounted once at the app root.** Every page renders inside the single `AppShell` in `src/main.tsx`. A capability adds content or fills the header slot, and never draws its own header, navigation or footer. Rationale: `/`, `/about` and the not-found route must carry the same frame as the area routes. Authored in change `swhr2-i-0002-bootstrap-landing-page-and` (design.md, Planning decision P1).
- **One global navigation fed by one area list.** A new primary area is one entry in `src/components/shell/areas.ts`, which both the navigation and the landing page read, never a second menu. Rationale: the navigation and landing links stay in step. Authored in change `swhr2-i-0002-bootstrap-landing-page-and` (design.md, P3).
- **Shared state frames for every data page.** Pages load through `useApi` and render `LoadingFrame` / `ErrorFrame` / `EmptyFrame` instead of bespoke loading, error or empty markup. Capability-specific wording is passed in as the frame's message. Rationale: every screen fails and empties the same way. Authored in change `swhr2-i-0002-bootstrap-landing-page-and` (design.md, Decisions).
- **Screen text comes from per-locale definitions, never page literals.** A new storefront screen adds one definition per supported locale under `src/locales/` and renders through `resolveScreen`; missing locales fall back to en_US. Rationale: the page-locale fallback rules stay in one resolver. Authored in change `swhr2-i-0003-localization` (design.md, Target design).
- **Code needed on both sides lives in `shared/`.** Both tsconfig projects include it; neither `src/` nor the server keeps a second copy. Rationale: the legacy store had four diverging copies of its locale parser. Authored in change `swhr2-i-0003-localization` (design.md, Components).
- **Request decoding runs first.** `middleware/00.encoding.ts` decodes every request as UTF-8 before the session middleware, sign-on or any handler reads a value; new middleware takes a prefix after it. Rationale: non-ASCII credentials must arrive decoded at sign-on. Authored in change `swhr2-i-0003-localization` (design.md, Components).
- **Money is integer hundredths.** Every stored price is an integer number of hundredths of the displayed unit, in every locale; formatting converts at the edge. Rationale: exact decimal amounts for cart and checkout totals, and one unit across locales. Authored in change `swhr2-i-0004-catalog-browsing-and-search` (design.md, Data; Planning P1), superseding localization's SD3.
- **Foreign keys are enforced.** `db/client.ts` turns on SQLite foreign keys, so every new table's references are real constraints. Rationale: the catalog hierarchy must refuse orphans (SWHR2-R-0037). Authored in change `swhr2-i-0004-catalog-browsing-and-search` (design.md, Data).
- **Every administration and supplier route makes an explicit access decision.** It calls `requireAdmin` or `requireSupplier` from `services/session/guards.ts`, and a storefront route that needs a customer calls `requireCustomer`; no route relies on a path being unlinked. Rationale: the legacy staff tools left endpoints unprotected (PRD constraints). Authored in change `swhr2-i-0005-sign-on-and-access-control` (design.md, Target design "Guards").
- **Sessions are server-owned and separated by area.** Storefront, administration and supplier each have their own cookie, session and credentials; H3's sealed-cookie `useSession` is not used. Rationale: state stays on the server, and an administration session can never stand in for a supplier one (SWHR2-R-0029). Authored in change `swhr2-i-0005-sign-on-and-access-control` (design.md, Target design; Planning P1).
- **Internal services have no route.** A service that only order processes call (message hand-off, order lines) is a server module without an HTTP route and applies no role check; access control sits on the calling route. Rationale: keeps one decision point per request (SWHR2-R-0121, SWHR2-R-0124). Authored in change `swhr2-i-0005-sign-on-and-access-control` (design.md, Target design "In-process hand-off").
- **In-process caches assume one server process.** The catalog page cache is a module-level map, valid only while the server runs single-process. Rationale: no external cache for a single-node deployment. Authored in change `swhr2-i-0004-catalog-browsing-and-search` (design.md, Stack choices).
