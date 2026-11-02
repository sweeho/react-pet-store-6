---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0033
capability_brief: SWHR2-I-0014
branch: vortex/sprint/swhr2-s-0033-f6a2221d
upstream: [artifacts/SWHR2-S-0033/qa-test-report.md]
---

# Release notes — SWHR2-S-0033

## Added

- **Full sample store.** A fresh installation now comes up with the complete sample catalog: 5 categories, 16 products and 28 items, each in English, Japanese and Chinese. It also has four demo accounts (`j2ee`, `j2ee-ja`, `shopper`, `j2ee-zh`, each with the password equal to its id) and supplier stock of 10,000 for EST-1 to EST-29. (SWHR2-T-0321)
- **One editable sample data file.** All sample data lives in `db/seed/petstore.json` (UTF-8). Edit it, for example by adding a product, then run `bun run db:seed` to load the change. (SWHR2-T-0321)
- **Safe reload.** Loading again restores the four demo accounts to their sample values. Accounts that people registered are left alone. (SWHR2-T-0321)

## Changed

- **The catalog is larger.** The storefront previously showed a 6-item demo catalog. It now shows all 16 products and 28 items, so category pages have more products (Dogs now has 6). (SWHR2-T-0321)
- **Starting the server no longer adds data.** The database is filled only by the seed step. `bun run dev` runs the seed step first. (SWHR2-T-0321)
- **Missing tables are restored.** If tables for one part of the store are missing from an existing database, the next start recreates them and leaves everything else as it is. (SWHR2-T-0321)

## Upgrade notes

- **Run `bun run db:seed` as part of installation** and after every upgrade that changes the sample data. Production servers started with PM2 or systemd do not seed by themselves.
- An existing `sqlite.db` keeps all its data. Seeding upserts the catalog and stock, and replaces only the four sample accounts.
- The template `/api/users` demo rows ("John Doe", "Jane Smith") are no longer inserted.
- No database migration and no new dependency.
