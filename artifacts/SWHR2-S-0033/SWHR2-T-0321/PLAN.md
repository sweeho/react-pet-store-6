# PLAN — SWHR2-T-0321 Sample data population

Change: `swhr2-i-0014-sample-data-population` (capability brief SWHR2-I-0014). Read the change's `design.md` FIRST, especially "Sprint planning (SWHR2-S-0033)". Decisions P1–P7 and spec discrepancies X1–X5 override "Target design" and `tasks.md` where they differ. Then read the delta spec `specs/data-population/spec.md` and the locked suite `tests/acceptance/data-population/` (`harness.ts`, `population.test.ts`, `e2e/areas.spec.ts`).

## Objective

Load the store from one editable UTF-8 seed file through `bun run db:seed`:

- 4 sample accounts, 5 categories, 16 products and 28 items in en/ja/zh, and supplier stock EST-1…EST-29 at 10000
- re-seeding restores only the sample accounts

Stop `db/client.ts` from inserting any data, and make it recreate tables that are missing although their migrations have run. No screen.

## Design reference

The brief has no approved mockup, and this capability has no user interface. Nothing to render.

## Steps

Work the `tasks.md` groups in order. Tick nothing yourself; the platform ticks the boxes on merge.

1. **Seed data** (§1; P4, P7, X1, X2).
   - Port `db/seed/petstore.json` from the legacy files on branch `vortex/legacy-spec/sx-0001`: `legacy-source/petstore1.3.2/src/apps/petstore/src/docroot/populate/Populate-UTF8.xml` (users, customers, catalog) and `.../apps/supplier/src/docroot/populate/Populate-UTF8.xml` (inventory). Fetch the branch with git; do not commit the legacy files.
   - Use top-level arrays `users`, `customers`, `categories`, `products`, `items` and `inventory`. Each product carries an `id` and per-locale details with `name`.
   - Write prices in integer hundredths per locale.
   - Author the ja_JP detail for EST-15.
   - Add `db/seed/types.ts`.
   - Check that the six items the old inline fixture held keep their values (P7).
2. **Datastore provisioning** (§2; P1, P2, P3).
   - Strip every insert from `db/client.ts` (template `users`, demo `j2ee`, catalog fixture, stock).
   - After `migrate()`, add the missing-table repair from a `:memory:` reference migration (P2).
   - Keep `db/schema.ts` as one file.
3. **Seeding operations** (§3; P5).
   - Add `services/customers/contact.ts#createContact` and make `createCustomer` use it.
   - Add `scripts/seed.ts`, exporting `loadSeed(data?)` and `seedInventory(exec, entries)`. In one transaction it deletes and recreates the sample accounts by id, upserts the catalog and upserts the inventory (a missing quantity means 0). It runs only under `import.meta.main`.
   - Add `"db:seed": "bun scripts/seed.ts"` and a `predev` hook to `package.json`.
   - Prefix both Playwright `webServer.command`s with `bun scripts/seed.ts &&` (P6).
4. **Test harness** (§4).
   - Unit tests for the loader (counts, re-seed keeps a non-sample account, missing quantity, added product), `createContact`, and the client's table repair.
   - Give `routes/api/users/*.test.ts` their own `users` rows.
   - Make sure `scripts/` is covered by typecheck and lint if a test or the loader needs it (tsconfig.node.json include).
   - Do not edit `tests/acceptance/**`.
5. **CI.** No workflow change. The existing job must be green on the ticket branch, including every e2e and locked browser spec that relies on seeded data (cart, checkout, supplier inventory, order approval).

## Fixed interface contracts

These are fixed by the locked suite. Do not rename them.

- `db/seed/petstore.json`: UTF-8 JSON with arrays `products` (items with `id` or `productId`, and detail objects carrying `name`), `customers` and `inventory`. It loads into exactly 4 `signon_users`, 4 `customers`, 5/15 `catalog_categories`/`_details`, 16/48 `catalog_products`/`_details`, 28/84 `catalog_items`/`_details` and 29 `sup_inventory` rows.
- `scripts/seed.ts`: `export async function loadSeed(data?: SeedData): Promise<void>` and `export function seedInventory(exec: Executor, entries: { itemId: string; quantity?: number }[]): void`. It has no side effect on import; run directly, it exits 0 on success and non-zero with nothing written on failure.
- `services/customers/contact.ts`: `export function createContact(exec: Executor, c: { givenName: string; familyName: string; telephone: string; email: string; addressId: number }): number` (contact id), writing `contact_info (given_name, family_name, telephone, email, address_id)`.
- `services/customers`: `listCustomers()` (rows with `userId`), `registerUser(userId, password)`, `createCustomer(userId, account, profile?)`, all unchanged in shape.
- `db/client.ts`:
  - Under Vitest, every table is empty after import.
  - Outside Vitest it uses `sqlite.db` in the working directory.
  - Any migration-created table that is missing is recreated with its reference SQL; existing tables are left byte-identical.
- Sample sign-on ids `j2ee`, `j2ee-ja`, `shopper` and `j2ee-zh`, each with password equal to its id as in the legacy data. `j2ee` must be able to sign in and order EST-1 (C-0079).

## File/module ownership

Create:

- `db/seed/petstore.json`, `db/seed/types.ts`
- `scripts/seed.ts` (+ its test)
- `services/customers/contact.ts` (+ test)

Modify:

- `db/client.ts` (+ a repair test)
- `services/customers/index.ts`
- `routes/api/users/index.get.test.ts`, `routes/api/users/[id].test.ts`
- `package.json`
- `playwright.config.ts`, `playwright.acceptance.config.ts`
- `tsconfig.node.json` and `vitest.config.ts`, only if the loader or its test needs including

## Definition of Done

AC-1 … AC-12 on the ticket, one per scenario, each proven by its locked case SWHR2-C-0068 … SWHR2-C-0079. Every other locked and project suite that relied on the old client-seeded demo data must stay green.
