# PLAN — SWHR2-T-0313 Customer notifications

Change: `swhr2-i-0012-customer-notifications` (capability brief SWHR2-I-0012). Read the change's `design.md` FIRST, especially its "Sprint planning (SWHR2-S-0031)" section. Decisions P1–P6 and the "Spec discrepancies" X1–X6 override "Target design" and `tasks.md` where they differ. Then read the delta spec `specs/customer-notifications/spec.md` and the locked suite `tests/acceptance/customer-notifications/` (`harness.ts`, `sender.test.ts`, `notifications.test.ts`).

## Objective

Send the order approval, shipment and completion e-mails, each behind its own deployment switch that is off by default. Delivery runs through the persisted outbox: three notification channels plus one `mail.outbound` channel, sent over SMTP with nodemailer and an operator-configured server, account and sender. No screen.

## Design reference

The brief has no approved mockup, and this capability has no user interface. Nothing to render.

## Steps

Work the `tasks.md` groups in order. Tick nothing yourself; the platform ticks the boxes on merge.

1. **Request contract** (§1; design.md "Data", P2). `services/notifications/request.ts`: validate `{ to, subject, content }` (all non-empty strings, otherwise throw naming the field), parse the `[recipient, subject, content]` JSON triple, and split the recipients leniently on commas into a To list.
2. **Channels** (§2; P1, P2, P4, X4, X5). Add `"notify.shipment"` to `SUBSCRIBERS["supplier.invoice"]` in `services/messaging/index.ts`. In `services/messaging/worker.ts`, add an async handler kind used only by `mail.outbound`: await the send outside the transaction, then mark the row `delivered`. A thrown transport error takes the existing retry path. A rejected request sets the row `failed`. Keep `processDue(): Promise<number>` and the existing sync handlers unchanged.
3. **Mail sender** (§3; P1, P6). `services/notifications/send.ts`: `sendMail({ to, subject, content })` validates and then calls `createTransport(config).sendMail({ from, to: [...], subject, html: content })`. It builds the transport at send time from the current env and applies no templating. Export a `mail.outbound` handler that the worker registers.
4. **Configuration** (§4; P3). `services/notifications/config.ts`: `mailConfig()` (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`/`MAIL_PASSWORD` → `auth`, `MAIL_FROM` defaulting to `customerservice@javapetstoredemo.com`) and `notificationSwitches()`. Both read `process.env` on every call.
5. **Order notifications** (§5; P4, P5). In `decide.ts#applyDecision`, enqueue `notify.approval` `{ orderId, status }` when the status moves. In `invoice.ts#handleInvoice`, enqueue `notify.completed` `{ orderId }` when the order becomes COMPLETED. Add the handlers in `services/notifications/handlers.ts` (`notify.approval`, `supplier.invoice/notify.shipment`, `notify.completed`), registered in the worker's handler map. Each handler checks its switch. When the switch is off it returns, so the row is consumed with no mail. When on, it renders from `services/notifications/templates/<locale>.ts`, falling back to en_US, and enqueues one `mail.outbound` triple to `op_purchase_orders.email`. The subjects are:
   - approval: `Order Status: <id>`
   - completion: `Java Pet Store Order COMPLETED: <id>`, with a body stating that the entire order has shipped and listing category, product, quantity and unit price per line through `shared/i18n/format.ts`
   - shipment: a subject that contains neither "Order Status:" nor "COMPLETED"
6. **Test harness** (§6). Unit tests beside each new module, shaped like `services/orders/decide.test.ts`; mock `nodemailer` with a capturing transport as the locked harness does. Extend `services/messaging/worker.test.ts` for the async path and the `failed` row. Do not edit `tests/acceptance/**`.
7. **CI.** No workflow change. The existing job must be green on the ticket branch.

## Fixed interface contracts

These are fixed by the locked suite. Do not rename them.

- `services/notifications/send`: `sendMail({ to: string, subject?: string, content?: string }): Promise<void>`. It rejects with a message containing the missing field's name (e.g. `/subject/i`) and sends nothing.
- `services/notifications/config`: `notificationSwitches(): { approval: boolean; shipment: boolean; completed: boolean }`.
- nodemailer usage: the default export or the named `createTransport(options)`, with `options.host` and `options.auth.user` set from the env, and `transport.sendMail(message)` where `message.from`, `.to`, `.subject` and `.html` are set. No `cc`/`bcc`.
- Env: `NOTIFY_APPROVAL_ENABLED`, `NOTIFY_SHIPMENT_ENABLED`, `NOTIFY_COMPLETED_ENABLED`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`.
- Channels: `notify.approval`, `notify.completed`, `mail.outbound`, and subscriber `notify.shipment` on `supplier.invoice`. The `mail.outbound` payload is `JSON.stringify([recipient, subject, content])`. The `notify.approval` and `notify.completed` payloads contain the order id as text.
- Unchanged: `enqueue(tx, channel, payload)`, `processDue(): Promise<number>`, `decideBatch(xml, exec?)`, `handleInvoice(xml, exec?)`.

## File/module ownership

Create: `services/notifications/request.ts`, `send.ts`, `config.ts`, `handlers.ts` and `templates/{en_US,ja_JP,zh_CN}.ts`, plus a `*.test.ts` beside each new module.
Modify: `services/messaging/index.ts`, `services/messaging/worker.ts` (+ `worker.test.ts`), `services/orders/decide.ts`, `services/orders/invoice.ts`, and `package.json`/`bun.lock` (add `nodemailer` and `@types/nodemailer`).

## Definition of Done

AC-1 … AC-22 on the ticket, one per scenario, each proven by its locked case SWHR2-C-0046 … SWHR2-C-0067. The existing order-approval and order-fulfillment acceptance suites must stay green.
