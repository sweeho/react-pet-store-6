# SWHR2-T-0290 summary: Checkout and order placement

CODE-REVIEW: self-review — the sub-agent route was not used; I read my full diff against the code-review checklist. Fixed: the checkout page read failure fields from the top level of the error body, where the `HTTPError` response nests them under `data` (the Server Error page lost the trace); the submit button now reads "Placing order" while a request is in flight, so the locked specs' `/^(confirm|place order)/` wait does not match a disabled button. Rejected: a separate confirm step (the mockup has none).

## What changed

- **Data.** `db/schema.ts` and migration `drizzle/0005_high_hemingway.sql` add `id_sequences`, `messages`, `op_purchase_orders`, `op_po_contacts`, `op_po_cards`, `op_po_line_items`, `op_order_workflow`.
- **Services.** `services/ids.ts` (`nextId`), `services/documents/purchase-order.ts` (`toXml`/`fromXml` over `fast-xml-parser`), `services/orders/receive.ts` (`createPurchaseOrder`, `getPurchaseOrder`, `receiveOrder`), `services/orders/place.ts` (`placeOrder`, `prefill`), `services/messages/index.ts` (`enqueue`, `drain`, `startWorker`), `plugins/order-worker.ts` (starts the `order.new` consumer, never under Vitest).
- **Routes.** `GET /api/checkout`, `POST /api/orders`.
- **Screens.** `/petstore/checkout`, `/petstore/order-placed`, rebuilt `error/server` (message, trace, notify the administrator) and `error/empty-cart`; checkout and order-placed text in en_US, ja_JP, zh_CN.
- **Seed (`db/client.ts`).** j2ee address "1 Main St", e-mail "abc@xyz.com", plus item EST-4 (design.md SD4).

## Deviations and decisions

- **Customer without an account** has no card to store; the order carries an empty card instead of failing placement. The harness customers in the locked suite have no account row.
- **Address line 2** is joined to the street on the order (`"1 Main St, Apt 5"`), because the locked `PurchaseOrder` shape has no second line.
- **`receiveOrder(messageId)`** takes the message id, not the XML (design.md P2 says XML), so it can mark the message done in the same transaction.
- **Order Placed heading** is "Your order is complete" (SD8); see `design-check.md` for every visual difference.
- **`db/client.ts` enables WAL and a 5 s busy timeout** for the file database (not under Vitest): the order worker polls the file, and a locked e2e spec that creates a trigger from another process failed intermittently without it.
- Error pages `error/server` and `error/empty-cart` keep hard-coded English like the pages they replace; only checkout and order-placed are localized.

## AC coverage

All 16 acceptance criteria map to cases SWHR2-C-0212 to C-0227, each cited by at least one colocated test (`services/ids.test.ts`, `services/documents/purchase-order.test.ts`, `services/orders/receive.test.ts`, `routes/api/orders/orders.post.test.ts`, `routes/api/checkout/checkout.get.test.ts`, `src/pages/petstore/checkout.test.tsx`). Deferred cases C-0089, C-0090, C-0101, C-0174, C-0252, C-0254 are cited too.

## Verification

- `bun run lint`: pass. `bun run typecheck`: pass. `bun run test`: 67 files, 274 tests pass.
- `bun run test:acceptance` (locked Vitest tiers): checkout and shopping-cart pass.
- Locked Playwright specs (`bunx playwright test --config playwright.acceptance.config.ts`), cases C-0212, C-0215, C-0216, C-0174, C-0089, C-0101, C-0252, C-0254: pass. Other capabilities' e2e specs (order-approval, sales-reporting, supplier-inventory, localization, data-population, a My List case, two sign-on admin/supplier cases) fail on this branch because those capabilities are not built; none cites this ticket.
