# SWHR2-T-0321 — Sample data population

**What changed.** The store is seeded from one editable UTF-8 file by `bun run db:seed`. `db/client.ts` no longer inserts rows and recreates tables that are missing after their migrations ran.

- `db/seed/petstore.json` + `types.ts`: ported from the legacy `Populate-UTF8.xml` files. 4 users and customers, 5 categories, 16 products, 28 items in en/ja/zh (prices in hundredths), inventory EST-1..29 at 10000. EST-15 ja_JP is authored (X1). The six items of the old inline fixture, their products, categories and the j2ee contact/profile keep the fixture values (P7), because existing e2e specs pin them.
- `scripts/seed.ts`: `loadSeed(data?)` validates, hashes passwords, then in one transaction replaces sample accounts by id, upserts catalog and inventory. `seedInventory` defaults a missing quantity to 0. Runs only under `import.meta.main`; exits non-zero with nothing written on failure.
- `db/client.ts`: all inserts removed; `repairMissingTables` rebuilds missing tables and their indexes from a `:memory:` reference migration (P2).
- `services/customers/contact.ts#createContact`, used by `createCustomer` and the loader.
- `package.json`: `db:seed`, `predev`. Both Playwright `webServer.command`s seed first. `tsconfig.node.json` includes `scripts`.
- `routes/api/users/*.test.ts` insert their own rows.

**AC coverage.** AC-1..12 = C-0068..0079, each cited by a test in `services/customers/index.test.ts`, `contact.test.ts`, `services/seed/*.test.ts`. Tests sit under `services/seed/` so the existing server project runs them with no vitest config change.

**Verification.** `bun run lint`, `bun run typecheck`, `bun run test` (427 passed), `bun run test:e2e` (20 passed). Locked unit suite: 7 failures (customer-notifications, sign-on/internal C-0264), identical on the base commit. Locked browser suite: localization C-0021/26/28/39 and customer-account C-0157 fail identically on the base commit.

**Disputes (locked tests wrong).** C-0079 (`areas.spec.ts:24`): `getByLabel(/^password/)` matches both the sign-in and registration forms on `/petstore/signin`; scoped to the sign-in form it passes. C-0197/0198 (`browse.spec.ts`): assume 3 DOGS; the approved 16-product seed has 6 (C-0075).

**Not done / open.** X2: EST-29 stays stocked and uncatalogued per C-0073. The ja_JP wording for EST-15 needs Business Owner confirmation.

CODE-REVIEW: self-review — sub-agent not run; reviewed the diff against the plan: loader atomic, no route seeds, no rows from client, repair touches only absent tables; fixed an unneeded duplicate delete.
