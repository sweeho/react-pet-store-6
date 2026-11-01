# Summary — SWHR2-T-0281 Checkout and order placement

CODE-REVIEW: self-review — no sub-agent run; read the diff for transaction scope, empty-cart ordering, XML escaping and locale fallbacks; no defects found.

## What changed

- Schema + migration `drizzle/0005_*`: `id_sequences`, `op_purchase_orders`, `op_po_contacts`, `op_po_cards`, `op_po_line_items`, `messages`, `op_order_workflow` (no FK into storefront tables).
- `services/ids.ts#nextId`, `services/documents/purchase-order.ts` (`toXml`/`fromXml`, `fast-xml-parser`), `services/orders/{receive,checkout}.ts`, `services/messaging/index.ts`, `plugins/message-worker.ts` (polls every second, `order.new` → receipt → `PENDING`).
- `GET /api/checkout` (pre-fill + cart), `POST /api/orders` (guard, empty cart 422, trim/required 400, id + outbox row in one transaction, then cart cleared).
- Pages `checkout`, `confirm-order`, `order-placed`; `error/server` and `error/empty-cart` rebuilt; `petstore-checkout` locale in en_US, ja_JP, zh_CN.
- `db/client.ts` dev seed customer now matches the locked e2e (1 Main St, abc@xyz.com).

## Deviations

- Order date is written as an ISO timestamp, not `yyyy-MM-dd`, so the locked round trip keeps milliseconds.
- Without an account card, the order uses the legacy demo card.
- Two-step flow after merge-gate return: Continue on the form, then Confirm order on `/petstore/confirm-order`; Order Placed shows "Your order is complete". State label is "State". No screenshots: no Chromium here.
- Open: locked `tests/acceptance/checkout/e2e/checkout.spec.ts:27` uses an unscoped `getByLabel(/^password:?$/i)` that matches both sign-in and sign-up password fields, which other locked specs require; disputed for C-0212, C-0215, C-0216.

## AC coverage

AC-1 to AC-16 are covered by the cases listed in tdd-test-result.md; C-0089/0101/0174/0252/0254 are also in `e2e/checkout.spec.ts`, not run here.

## Verification

- `bun run verify`: exit 0, 281 tests passed.
- `vitest --config vitest.acceptance.config.ts tests/acceptance/checkout`: 14 passed.
- Dev server smoke (curl): sign-in, add to cart, `/api/checkout`, `POST /api/orders` returned `10011`; the worker stored the order with workflow `PENDING`.
