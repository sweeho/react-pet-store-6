# Summary — SWHR2-T-0317 Admin order and sales reporting

CODE-REVIEW: self-review — read the full diff against the ACs and plan; no findings to fix (sub-agent not run).

`/admin/tool` is now "Orders and sales": Orders | Sales views (opens on Orders), Pending/Non-pending tabs plus the compact charts on Orders, Pie/Bar chart tabs on Sales; nav entry renamed and repointed.

- API: `GET /api/admin/orders` exact-match status, bare array, UTC `M/D/YYYY` (missing status → 400); `salesByCategory` takes optional `category` (per-item); `order-count` route renamed `order-counts`, both sales routes pass `category`.
- UI: `OrderTable` default export (`orders`), sortable headers on both tables (`SortHeader`, `aria-sort`), -1 for non-numeric id, empty state; `formatDate` passes `M/D/YYYY` through; `ChartPanel` gains `large`.
- Tests: new `OrderTable.test.tsx`, `sales.test.ts`; updated orders route, tool page and GlobalNav tests.
- Deviation: compact charts kept on Orders view (P2/X2). Design differences in `design-check.md`.
- AC coverage: AC-1…15 via C-0001…C-0015, all pass in the recorded green and locked acceptance runs.
- Verification: `bun run verify` pass (414 tests); `bun run test:e2e` 20 passed.
