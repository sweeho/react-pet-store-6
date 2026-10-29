---
ticket: SWHR2-T-0159
---

# SWHR2-T-0159 Catalog browse-to-cart verification

- `e2e/catalog.spec.ts` (new): home, Dogs (side panel), Bulldog, items each with Add to Cart, add Male Adult Bulldog, it shows on the cart page. NOT executed locally (no Chromium in this container); CI runs it.
- `routes/api/catalog/browse-to-cart.test.ts` (new): the same journey at API level (DOGS products, Bulldog items, add to cart, cart line); cites C-0206 and C-0207 for the platform runs.
- Plan steps 1-3 (paging, keyword parsing and matching, route integration, page UI tests) were already covered by T-0155..T-0158; I found no gap and added nothing. No product defects found. No workflow change.
- AC-1, AC-2: covered by the two tests above.

Verification: `bun run verify` passes (lint, typecheck, Vitest). `bun run test:e2e` not run (browser missing). The acceptance suites were not run locally; CI reports them.

CODE-REVIEW: self-review — test-only change; selectors checked against the page sources and the locked acceptance spec.
