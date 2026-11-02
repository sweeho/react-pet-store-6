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

**Backend**: `routes/api/*.ts` → `/api/*`, `middleware/*.ts` runs first and can set `event.context`. Requires `nitro({ serverDir: "./" })` in `vite.config.ts` — default is `false` (no scanning). `*.test.ts` excluded via `nitro({ ignore })`. Nitro runs `middleware/` files in file-name order, so a numeric prefix fixes the order: `00.encoding.ts` (UTF-8 request decoding) runs before `10.session.ts` (server-owned session, including the shopper's locale and sign-on state) and before any route handler.

**Site shell**: `src/main.tsx` mounts one `AppShell` (header, global navigation rail, main, footer) around every route, so a page renders only its own content. Area routes (`/petstore/**`, `/admin/**`, `/supplier/**`) are `vite-plugin-pages` parent-route files that render `<Outlet />` and may fill the shell's header slot. The global navigation and the landing page both read the primary-area list in `src/components/shell/areas.ts`. Spec: `openspec/specs/site-shell/` once change `swhr2-i-0002-bootstrap-landing-page-and` archives.

**Localization**: a storefront screen takes its text and layout from a per-locale definition in `src/locales/<locale>/`, looked up through `src/locales/resolveScreen.ts` (request `locale` parameter over the session locale, then en_US fallback, then a "Definition for screen <name> not found" error). Locale codes, number/money formatting and word splitting live once in `shared/i18n/` for both sides; server routes pick localized catalog rows through `services/locale.ts`. Spec: `openspec/specs/localization/` once change `swhr2-i-0003-localization` archives.

**Sessions and access control**: there are three separate session areas, each with its own `HttpOnly` cookie and idle limit: storefront (`ps_sid`, 15 minutes), administration (`admin_sid` on `/api/admin/**`, 54 minutes) and supplier (`supplier_sid` on `/api/supplier/**`). `middleware/10.session.ts` picks the area's session for the request, drops it when idle, and exposes it as `event.context.session`. An ended storefront session takes its cart with it.

Routes decide access explicitly through the guards in `services/session/guards.ts`. `requireCustomer` protects account editing and the checkout steps. Every route under `/api/admin/**` and `/api/supplier/**` calls `requireAdmin` or `requireSupplier`. A 401 with failure kind `SignOnRequired` makes the SPA send the user to that area's sign-in screen and back. Internal services (message hand-off, order-line data) have no HTTP route and no role check of their own; the route that calls them decides. Storefront passwords are stored hashed (`Bun.password`). Administration and supplier credentials come from the operator's `ADMIN_USERS` / `SUPPLIER_USERS` environment, never from seed data. Spec: `openspec/specs/sign-on/` once change `swhr2-i-0005-sign-on-and-access-control` archives.

**Failure routing**: a request failure is a typed failure kind with a chain of parent kinds, all under `AppFailure` (`services/errors.ts`). For example, `EmptyCartOrder` belongs to `OrderFailure`, and `ItemNotFound` belongs to `CatalogError`. A route reports one as `{ kind, kinds, message, trace }`, where `kinds` runs from the kind itself up to `AppFailure`, and any unexpected error becomes a 500 `AppFailure`. The SPA keeps one table from kind to error page (`src/errors/routeFailure.ts`). It walks `kinds` until it finds a page, so a page configured for a general kind catches its specific kinds, and an unmapped failure shows the Server Error page. Spec: `openspec/specs/shopping-cart/` (SWHR2-R-0116) once change `swhr2-i-0007-shopping-cart` archives.

**Page data states**: a data-driven page loads through `src/hooks/useApi.ts` (`{ data, error, loading, retry }`) and maps the three states onto the shared `LoadingFrame`, `ErrorFrame` (with retry) and `EmptyFrame`.

## Data flow example

`GET /api/hello`: the boilerplate `middleware/auth.ts` sets a fixed demo `event.context.user` → `routes/api/hello.ts` reads it and responds. It is not the sign-on identity, which is `event.context.session.userId`. `routes/api/users/[id].ts` shows the dynamic-route + `createError()` 404 pattern, backed by a real query against `db/client.ts`'s Drizzle instance.

## Database

`db/schema.ts` defines Drizzle tables; `db/client.ts` opens the SQLite connection with foreign keys enforced (`PRAGMA foreign_keys = ON`), runs pending migrations from `drizzle/`, and seeds two demo users, a sample catalog and its supplier stock if the tables are empty. Routes import `db` and the table objects directly (see `routes/api/users/`), or call a `services/` helper when the query is domain logic (`services/catalog/`, `services/cart.ts`).

- Catalog: `catalog_categories` → `catalog_products` → `catalog_items`, each with a `*_details` table keyed by `(id, locale)` that holds the localized name, description, attributes and (for items) list price and unit cost. Parent references are foreign keys. `services/catalog/` is the only reader of these tables: an item is visible in a locale only where both it and its product have details there, there is no cross-locale fallback, and a store failure surfaces as `CatalogError` (500), never as an empty list. Spec: `openspec/specs/catalog-browsing/` once change `swhr2-i-0004-catalog-browsing-and-search` archives.
- Money is stored as integers in hundredths of the displayed unit in every locale (16.50 → 1650, ¥1951 → 195100); code divides by 100 only when it hands a value to `shared/i18n/format.ts#formatMoney`.
- Catalog list reads (categories, a category's products, a product's items) are served through an in-process 5-minute cache shared by all shoppers; item detail and search are always read live.
- Session and cart are in memory, not in SQLite: `middleware/10.session.ts` keys each `{ id, area, locale, userId?, lastSeen }` session by its area cookie, and the session-only cart, keyed by session id, lists its lines in the cart's locale (en_US when none is set).
- Credentials: `signon_users (user_id, password_hash)` holds storefront sign-on credentials. Sign-on reads it and customer-account writes it at registration.
- Customers: `customers` is keyed by the sign-on `user_id`, and each customer owns exactly one `customer_accounts` row and one `customer_profiles` row.
  - The account holds the status (`active` or `disabled`) and the payment card, and references one `contact_info` row, which in turn references one `addresses` row.
  - The profile holds the preferred language, an optional favourite category, and the MyList and banner flags.
  - `services/customers/` is the only writer, and it creates the whole set in one transaction. Checkout reads contact and address data through the same service. Spec: `openspec/specs/customer-account/` once change `swhr2-i-0006-customer-account-and-profil` archives.
- Id sequences: `id_sequences (prefix, next_value)`. `services/ids.ts#nextId(prefix)` issues `prefix + next value` inside the caller's transaction. Storefront order ids come from prefix "1001".
- Order processing: `op_purchase_orders` (keyed by order id, holding the billing contact) owns `op_po_contacts` (shipping), `op_po_cards` and `op_po_line_items`, all with cascade delete. `op_order_workflow` holds each order's one current status, constrained to PENDING, APPROVED, DENIED, SHIPPED_PART and COMPLETED; every status write goes through `services/orders/workflow.ts`, which allows only PENDING → APPROVED | DENIED, APPROVED → SHIPPED_PART | COMPLETED and SHIPPED_PART → COMPLETED. These tables have no foreign key into the storefront tables. `services/orders/` is the only writer. Spec: `openspec/specs/checkout/` once change `swhr2-i-0008-checkout-and-order-placemen` archives.
- Supplier stock: `sup_inventory (item_id, quantity)` holds exactly one whole-number count per item. It has no foreign key into the catalog, and the seed data keeps the item ids aligned. `services/supplier/inventory.ts` is the only writer outside seeding. A supplier update overwrites the marked counts and enqueues one `supplier.inventory-changed` message in the same transaction. Fulfilment draws stock down through its `reduceStock`. The supplier screens are `/supplier` and `/supplier/inventory`, backed by `GET`/`POST /api/supplier/inventory`. Spec: `openspec/specs/supplier-inventory/` once change `swhr2-i-0010-supplier-inventory` archives.
- Supplier orders: `sup_orders` (keyed by order id, status PENDING / APPROVED / DENIED / COMPLETED) owns `sup_order_contacts` (shipping address) and `sup_order_lines` (copied lines with `quantity_shipped`), all with cascade delete. `services/supplier/orders.ts` creates them as one unit; `services/supplier/fulfil.ts` ships whole lines through `services/supplier/inventory.ts#reduceStock` and publishes one invoice per shipment. Spec: `openspec/specs/order-fulfillment/` once change `swhr2-i-0011-order-fulfilment-and-invoic` archives.
- Documents exchanged between stages are XML built and read in `services/documents/` (purchase order, supplier order, invoice). Their formats are published without authorisation at `GET /schemas/catalog.xml` and under `public/schemas/`, and resolve from a deployment catalog (`DOC_CATALOG_PATH`) before the built-in one.
- Messages: `messages (channel, subscriber, payload, status, attempts, available_at, …)` is the persisted outbox that carries every asynchronous hand-off between the storefront, order processing and the supplier. A producer calls `services/messaging#enqueue` inside its own transaction, which writes a `pending` row due now. The in-process worker (`services/messaging/worker.ts`, started by a Nitro plugin under `plugins/`, never under Vitest) delivers each due row through the handler its channel is registered to in that file, and sets it `delivered` in the same transaction. A handler that fails rolls back, `attempts` is raised and its row stays `pending` until a later due time, so a message is kept until it is consumed. A publish/subscribe channel lists its subscribers in `services/messaging#SUBSCRIBERS`, and `enqueue` writes one row per subscriber, each delivered to that subscriber's handler. Channels: `order.new` (the `PurchaseOrder` XML, checkout → order processing) `order.approval` (the `OrderApproval` batch, administrator and auto-approval decisions → order processing) `supplier.purchase-order` (the supplier order XML, approval → supplier), `supplier.invoice` (the `Invoice` XML, publish/subscribe; subscriber `order-processing.invoice`) and `supplier.inventory-changed` (`{ itemIds }`, supplier stock update → re-fulfilment of waiting supplier orders). Specs: `openspec/specs/checkout/`, `openspec/specs/order-approval/` and `openspec/specs/order-fulfillment/` once their changes archive.
- Approval: receipt starts every order's workflow PENDING and then applies `services/orders/approval.ts#autoApproves`, the single home of the per-locale thresholds. `services/orders/decide.ts` is the only code that moves a workflow out of PENDING on a decision. The administration tool (`/admin/tool`) reads orders through `GET /api/admin/orders` and sends decisions to `POST /api/admin/orders/decisions`, which only enqueues them.

- `bun run db:generate` — after editing `db/schema.ts`, generates a new migration into `drizzle/` (via `drizzle-kit`, config in `drizzle.config.ts`)
- `bun run db:studio` — browse the db in Drizzle Studio
- The db file itself is `sqlite.db` at the project root (gitignored, created on first run); `drizzle/` migrations are committed
- Under Vitest (`VITEST=true`), `db/client.ts` swaps in an in-memory db instead, so tests never touch the dev database

## Testing

Four tiers, one worked example each. Commands and how to extend: [README.md](./README.md#testing), [AGENTS.md](./AGENTS.md).

## Deployment

- `ecosystem.config.js` (PM2) runs the real build: `.output/server/index.mjs`, under Bun (`interpreter: "bun"`) — required by `db/client.ts`'s `bun:sqlite` import. `nitro.service` (systemd) is the non-PM2 equivalent, same requirement.
- The server runs as exactly one process (`instances: 1`): the session store, the cart and the catalog page cache live in that process's memory, and the message worker runs in that same process. Scaling out needs a shared store for all three first, and a claim step so that two workers cannot consume the same message.
- The file database (`sqlite.db`) runs in WAL mode with a 5 s busy timeout, set in `db/client.ts` (not under Vitest), because the message worker polls it while requests and other processes write. A writer that bypasses `db/client.ts` must expect `SQLITE_BUSY` without them.
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
- **In-process caches assume one server process.** The catalog page cache is a module-level map, valid only while the server runs single-process. Rationale: no external cache for a single-node deployment. Authored in change `swhr2-i-0004-catalog-browsing-and-search` (design.md, Stack choices).
- **Every administration and supplier route makes an explicit access decision.** Routes guard with `requireAdmin` / `requireSupplier` / `requireCustomer` from `services/session/guards.ts`; a route with no guard is a defect. Internal services have no route and no role check, and their caller decides. Rationale: the legacy staff tools were partly unprotected. Authored in change `swhr2-i-0005-sign-on-and-access-control` (design.md, Guards; In-process hand-off).
- **Sessions are area-scoped and server-owned.** Storefront, administration and supplier sessions use separate cookies, credentials and idle limits, and a live administration session blocks supplier sign-in. Rationale: the areas must not share a sign-on (SWHR2-R-0029/0030). Authored in change `swhr2-i-0005-sign-on-and-access-control` (design.md, Session middleware; Area separation).
- **Data operations join the caller's transaction or open their own.** A service write that another change may need to combine takes an optional Drizzle `tx`, runs inside it when given, and otherwise calls `db.transaction` itself. Transaction bodies are synchronous, because `bun:sqlite` transactions do not span an `await`. Rationale: checkout must write order, contact and address data as one unit (SWHR2-R-0057, SWHR2-R-0060). Authored in change `swhr2-i-0006-customer-account-and-profil` (design.md, Planning P2).
- **Asynchronous hand-offs go through the `messages` outbox, consumed in-process.** A producer enqueues a `pending` row on a named channel inside its own transaction, and a handler registered with the single in-process worker consumes it. There is no broker, and no producer calls the consumer directly. Rationale: the specification requires durable, asynchronous delivery (order hand-off, approvals, supplier orders, invoices, e-mails) inside one monolith. Authored in change `swhr2-i-0008-checkout-and-order-placemen` (design.md, Planning P1/P2).
- **Supplier stock changes only through `services/supplier/inventory.ts`.** Updates and fulfilment draw-down call its functions inside the caller's transaction, and every update enqueues `supplier.inventory-changed` in that transaction. Rationale: a restock must commit with the notification that re-examines waiting orders, and the count must never go below what fulfilment checked. Authored in change `swhr2-i-0010-supplier-inventory` (design.md, Planning P2).
- **Order status changes only through the workflow module.** Every write to `op_order_workflow` goes through `services/orders/workflow.ts`, whose transition guard enforces the lifecycle, and readers use its `getOrderStatus`. Rationale: administrators' lists, sales charts and e-mails must read one current status, and the legacy store accepted any transition. Authored in change `swhr2-i-0011-order-fulfilment-and-invoic` (design.md, Planning P2, SD8).
- **A new consumer of a published message is a new subscriber, not a new channel.** Publish/subscribe channels list their subscribers in `services/messaging#SUBSCRIBERS`, and each subscriber gets its own row, retries and delivery status. Rationale: one invoice must reach order processing and shipment notification independently (SWHR2-R-0109). Authored in change `swhr2-i-0011-order-fulfilment-and-invoic` (design.md, Planning P1, SD4).
- **Request failures are typed kinds routed through one error-page table.** A new failure is an `AppFailure` subclass naming its parent kind, and a new error page is one entry in `src/errors/routeFailure.ts`, never a per-page error mapping. Rationale: a page for a general kind must catch every kind under it, and an unmapped failure must reach the Server Error page (SWHR2-R-0116). Authored in change `swhr2-i-0007-shopping-cart` (design.md, Target design → Failure routing; Planning P3/P4).
