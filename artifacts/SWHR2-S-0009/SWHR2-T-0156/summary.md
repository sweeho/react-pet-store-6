# SWHR2-T-0156 Catalog keyword search

- `services/catalog/search.ts`: `search(text, locale, start = 0, size = 2)` splits on whitespace into distinct keywords; none left returns the empty page with no query. One query matches any keyword as a case-insensitive substring of product name, category id or item description (`lower(..) like ? escape '\'`, `%`/`_`/`\` escaped, each keyword bound once per field), joined on the same locale, ordered by item id, paged with the T-0155 `pageOf`. Store errors become `CatalogError`.
- `services/catalog/index.ts`: placeholder `search` replaced by an export line.
- Deviation: `data-access.ts` now exports `itemsQuery` and `toItemRow` (two `export` keywords) so search reuses the item join and row mapping.
- `search` now returns the page envelope, not an array; the C-0210 line in `queries.test.ts` reads `.items`.

AC-1..AC-7 covered by cases C-0178..C-0182, C-0208, C-0209. Verification: `bun run verify` passed (118 tests). E2E not run.

CODE-REVIEW: self-review — sub-agent not run; checked LIKE escaping, locale joins and the empty-text path; no findings.
