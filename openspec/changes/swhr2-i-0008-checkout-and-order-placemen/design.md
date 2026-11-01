# Checkout: legacy implementation notes

These notes record how Java Pet Store 1.3.2 implements checkout. The visible contract of each screen and every behaviour is stated in `specs/checkout/spec.md`; this file explains where it lives in the legacy code and what the extraction could not settle. No target design is proposed here.

## Source map

| Concern                            | Legacy location                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Order information entry screen     | `src/apps/petstore/src/docroot/enter_order_information.jsp` (English) and `ja/enter_order_information.jsp`; protected page; posts to `order.do`                                                                          |
| Server-side form handling          | `petstore/controller/web/actions/OrderHTMLAction.java` (`perform`, `extractContactInfo`, `doEnd`)                                                                                                                        |
| Order placement                    | `petstore/controller/ejb/actions/OrderEJBAction.java`, run inside `ShoppingControllerEJB` under transaction `Required`                                                                                                   |
| Screen routing                     | `docroot/WEB-INF/mappings.xml`: `order.do` -> `order_complete.screen` (line 78); `ShoppingCartEmptyOrderException` -> `cart_empty_order_error.screen` (line 110); `GeneralFailureException` -> `error.screen` (line 112) |
| Order complete screen              | `docroot/order_completed.jsp` reading request attribute `orderresponse` (`OrderEventResponse(email, orderId)`)                                                                                                           |
| Empty-cart error screen            | `docroot/cart_empty_order_error.jsp`                                                                                                                                                                                     |
| General error page                 | `docroot/general_error.jsp`                                                                                                                                                                                              |
| Order hand-off                     | `components/asyncsender` `AsyncSenderEJB.sendAMessage(String)`; `jms/AsyncSenderQueue` bound to `jms/opc/OrderQueue` in `apps/petstore/src/sun-j2ee-ri.xml`                                                              |
| Order intake                       | `apps/opc` `PurchaseOrderMDB` listening on `jms/opc/OrderQueue`                                                                                                                                                          |
| Purchase order document and entity | `components/purchaseorder` (`PurchaseOrder.java`, `PurchaseOrder.dtd`, `PurchaseOrderEJB`)                                                                                                                               |
| Card, contact, line item           | `components/creditcard`, `components/contactinfo`, `components/lineitem` (CMP 2.x entity beans plus value objects and DTDs)                                                                                              |
| Order id                           | `components/uidgen` (`UniqueIdGeneratorEJB`, `CounterEJB`, table `CounterEJBTable`)                                                                                                                                      |

## Screens

- **Order information entry.** Billing fields carry the suffix `_a`, shipping fields `_b`. Pre-fill comes from `${customer.account.contactInfo...}`, which depends on the customer object placed in the session at sign-on (record SIGN-WF-0005, another capability). Required inputs and e-mail carry the WAF `validation="validation"` attribute, which produces a browser-side "is empty" alert; that is the only check on e-mail. State and country lists are fixed `waf:select` options with no server-side check. The account form stores the United States as `USA` while this form's option value is `United States`, so a US customer's stored country does not preselect.
- **Order complete.** `OrderHTMLAction.doEnd` stores the response under `orderresponse`; the JSP prints `orderId` and `email`. The confirmation e-mail itself is sent by the order processing centre, not by checkout. Pass A titled the screen "Order Placed"; the JSP heading is "Your Order is Complete".
- **Order error (empty cart).** Reached by exception mapping rather than a URL; stated in the spec under the empty-cart refusal requirement.
- **Server error.** Mapped to `error.screen`, but the three `screendefinitions_*.xml` files define only `general_error`. Whether shoppers see `general_error.jsp` or a container error depends on how the WAF TemplateServlet resolves an undefined screen name. `general_error.jsp` also prints the raw exception message unescaped and the stack trace; the spec deliberately does not require the trace.

## Order placement sequence (`OrderEJBAction`)

1. Look up the id generator and call `getUniqueId("1001")`. Lookup failures are printed and execution continues with a null generator.
2. Populate `PurchaseOrder`: order id, user id from `ShoppingClientFacade`, `emailId` from the bill-to contact, `new Date()`, ship-to, bill-to, card, locale from the state machine.
3. Throw `ShoppingCartEmptyOrderException` if the cart has no items (lines 128-132), before anything is sent.
4. Build line items with a post-incremented counter starting at 0 and accumulate `float totalCost += unitCost * quantity`.
5. `AsyncSender.sendAMessage(purchaseOrder.toXML())`. `ServiceLocatorException` and `XMLDocumentException` are printed, `CreateException` is ignored; an `EJBException` from the send itself is not caught and rolls back the transaction.
6. `cart.empty()` and return `OrderEventResponse(billTo email, orderId)`.

The payment card is constructed in `OrderHTMLAction` line 82 as `new CreditCard("1234-2334", "Duke Express", "10/2001")` under the comment `XXXX this needs to be part of the form`. The value-object constructor's parameter order is (number, expiry, type), so this call stores "Duke Express" as the expiry and "10/2001" as the type; a later expiry read therefore falls back to 01/2010.

## Persistence

- `PurchaseOrderEJB`: CMP fields `poId` (String PK), `poUserId`, `poEmailId`, `poDate` (long epoch millis), `poLocale`, `poValue` (float); CMR `contactInfo` 1:1, `creditCard` 1:1, `lineItems` 1:N, cascade-delete on the child side. `ejbPostCreate` creates the contact from `getShippingInfo()` only; `getData` copies that contact to both billing and shipping (line marked `// XXX`).
- OPC tables in `apps/opc/src/sun-j2ee-ri.xml`: `ContactInfoEJBTable`, `AddressEJBTable`, `CreditCardEJBTable`, each with a surrogate `__PMPrimaryKey`. `cardNumber` is a plain `VARCHAR(255)`.
- `CounterEJBTable`: `counter INTEGER NOT NULL`, `name VARCHAR(255)` primary key. The deployment mapping creates the table on deploy and drops it on undeploy.
- Money is single-precision `float` throughout (line unit price, order total, document `UnitPrice`/`TotalPrice`), while catalog prices are `DECIMAL(10,2)` in `item_details`.

## Document formats

DTDs with public ids `-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD <Name> 1.1//EN` for PurchaseOrder, CreditCard, LineItem and ContactInfo. `PurchaseOrder.fromXML` validates by default (`VALIDATING = true`); the OPC intake toggles validation through env-entry `param/xml/validation/PurchaseOrder`, whose value is redacted in this copy. Order dates use `SimpleDateFormat("yyyy-MM-dd")`; a parse failure is caught, replaced by `new Date()` and written to `System.err`. `ContactInfo.fromDOM` reads Email with `true /*false*/`, an in-line change from mandatory to optional with no recorded reason.

## Open questions and disputes

- **Q1 Server error routing** (CHK-REQ-0010, `conflicting-sources`): settle by running the legacy app or reading WAF screen resolution.
- **Q2 Older checkout flow** (CHK-WF-0001 in `src/waf`, `unresolved-reachability`): `docroot/WEB-INF/xml/requestmappings.xml` describes a multi-step shipping/billing validation flow, but `MainServlet` and `ScreenFlowManager` read `/WEB-INF/mappings.xml`. It is treated as historical and is not in the spec.
- **Q3 Pass disagreement on order-id prefix semantics**: one petstore pass left open whether "1001" is a name, prefix or first value; the uidgen passes settle it as a prefix (ids "10011", "10012", ...).

## Suspected legacy defects (for the defect register)

- **D1** Every order carries the hard-coded, already-expired demo card; the customer's card is never used.
- **D2** Card value-object constructor argument order swaps type and expiry for both checkout and account callers.
- **D3** Full card number stored in clear text, written into the order document and readable without a role check.
- **D4** Hand-off lookup or document-build failures are swallowed; the cart is emptied and a confirmation shown for an order order processing never receives. A generator lookup failure ends in a null dereference.
- **D5** Server-side missing-field errors are stored in request attribute `missing_form_data_exception`, which nothing reads; a null contact is returned and order processing then fails on `billTo.getEmail()`. The missing-state label is built as `State or Province_a`.
- **D6** The billing contact is discarded at persistence and the shipping contact reported as billing.
- **D7** Unreadable order dates are silently replaced with the processing date.
- **D8** Money held as binary float with no rounding to cents.
- **D9** Sequence table dropped on undeploy, so order ids restart and repeat; prefix and number joined without a separator can collide across prefixes; 32-bit counter wraps negative; find-then-create races on first use.
- **D10** Errors closing the queue connection are discarded without logging.

## Specification coverage

`specs/checkout/spec.md` carries only the six SME-approved records (SWHR2-R-0003 to SWHR2-R-0008). Every other checkout record, including the three screen records (CHK-SCR-0001, CHK-SCR-0008, CHK-SCR-0009), is Not specified until approved; see `legacy-analysis/ir/_recommendations/checkout.yaml`. The approved CHECKOUT-REQ-0001 (pre-filled billing and shipping form) is written as the screen requirement. Record keys CHK-BR-0006 and CHK-WF-0001 occur in more than one pass file with different text; the spec uses the `src/apps/petstore/a.yaml` text for CHK-BR-0006 and the `src/components/purchaseorder/a.yaml` text for CHK-WF-0001.

## Target design

### Components

- **Billing and shipping page** `src/pages/petstore/checkout.tsx`, guarded by sign-on (sign-on SWHR2-R-0028). It loads `GET /api/checkout`, which is pre-filled from the signed-on customer's contact information and address (customer-account), so the customer can submit without re-entering anything (SWHR2-R-0005).
- **Order placement** `routes/api/orders/index.post.ts` (SWHR2-R-0049):
  1. Require a signed-on customer.
  2. Read the session cart. If it is empty, throw `EmptyCartOrder`, which shows the empty-cart order error page (shopping-cart SWHR2-R-0116).
  3. Price the lines from the catalog in the session locale.
  4. Take an order id from the `"1001"` sequence.
  5. Build the `PurchaseOrder` document.
  6. In one SQLite transaction, enqueue it on the `order.new` channel (order-fulfillment).
  7. Clear the cart (shopping-cart SWHR2-R-0147).
  8. Return `{ orderId }`.

  The request completes without waiting for approval (SWHR2-R-0049). The screen shown after placement is PRD open question 6 (Order Placed screen).

- **Id sequences** `services/ids.ts`. `nextId(prefix)` refuses a null or empty prefix (SWHR2-R-0007). Inside a transaction it creates the prefix's sequence row on first use, increments it and returns `prefix + counter`, so the "1001" sequence issues "10011", "10012", "10013", … (SWHR2-R-0006, SWHR2-R-0008). If the sequence row cannot be created or the store cannot be reached, it throws and issues no id (SWHR2-R-0051).
- **Order document codec** `services/documents/purchase-order.ts` (SWHR2-R-0050). `toXml(po)` renders a document with root `PurchaseOrder`, whose card is `CreditCard` containing `CardNumber`, `CardType` and `ExpiryDate` in that order, each as text. `fromXml(text)` rejects a document whose root is not `PurchaseOrder` with "PurchaseOrder element expected." and a card element that is not `CreditCard` with "CreditCard element expected.". A round trip yields an equal order.
- **Order receipt** `services/orders/receive.ts` is called by the order-processing worker for each `order.new` message. It decodes the document and calls `createPurchaseOrder(tx, po)`, which in one transaction stores:
  - the header
  - one contact record built from the shipping information, with its address
  - one credit-card record
  - one line item per order line with `quantity_shipped = 0`

  Any failed insert fails the whole creation and keeps no part of it (SWHR2-R-0004). A duplicate order id is refused and leaves the stored order unchanged (SWHR2-R-0052). Receipt then starts the order workflow in PENDING and applies auto-approval (order-approval). `getPurchaseOrder(orderId)` retrieves an order by id (SWHR2-R-0052).

- **Server Error page** `src/pages/petstore/error/server.tsx` (SWHR2-R-0003). Any unexpected failure is answered with `{ kind: "AppFailure", message, trace }`, and the page shows "Server Error", the message, the trace, and a request to notify the administrator. This is the fallback for unmapped failures in shopping-cart's failure routing.

### Data

These tables are in `db/schema/storefront.ts` (the id sequence) and `db/schema/order-processing.ts` (purchase orders). Building them produces one new drizzle-kit migration in `drizzle/`.

- `id_sequences` (storefront group): `prefix` text primary key and `next_value` integer not null.
- `op_purchase_orders`: `order_id` text primary key (SWHR2-R-0052).
  - `user_id`, `email`, `locale`, `order_date` (integer timestamp, UTC) and `total`, an integer in hundredths of the order currency (PRD constraints: money in integer minor units).
  - The billing contact and address fields.
- `op_po_contacts`: `order_id` primary key, referencing `op_purchase_orders` with `ON DELETE CASCADE`. It holds the shipping given and family name, street, city, state, country, zip, e-mail and phone.
- `op_po_cards`: `order_id` primary key, cascade, with `card_number`, `card_type` and `expiry_date`. Card details are captured and never charged (PRD non-goals).
- `op_po_line_items`: `(order_id, line_number)` primary key, cascade, with `category_id`, `product_id`, `item_id`, `quantity`, `unit_price` and `quantity_shipped` (default 0).

The order-processing tables keep no foreign key into the storefront group (data-population). The order document travels as XML text in the `messages` table (order-fulfillment).

### Interfaces

- `GET /api/checkout` (customer): returns the pre-fill `{ billing, shipping }`.
- `POST /api/orders` (customer): body `{ billing, shipping }` → `{ orderId }`. Failure kinds are 401 `SignOnRequired`, 422 `EmptyCartOrder` and 500 `AppFailure`.
- `order.new` channel payload: the `PurchaseOrder` XML text, consumed by order processing in-process (sign-on SWHR2-R-0121).

### Stack choices

- Nitro (H3) routes, and Drizzle ORM transactions over SQLite (`drizzle-orm/bun-sqlite`).
- `fast-xml-parser` (pure JavaScript, runs under Bun) to build and parse the `PurchaseOrder` document with element order preserved. This dependency is assumed, because no XML library is in the pinned stack.
- The asynchronous hand-off goes through the persisted outbox table instead of a message broker (PRD constraints).
- Tests: unit tests for `nextId` and the codec (round trip, both rejection messages); route integration tests for empty cart, unsigned visitor, sequential ids and the cart cleared after placement; a test that a failing card insert leaves no order rows.

## Planning — SWHR2-S-0023

One FEATURE, **SWHR2-T-0281**, owns every task group (1 to 7) in order. No SPIKE: Q1 is settled by the approved Server Error mockup and SWHR2-R-0003, Q2 is out of scope, and Q3 is settled as a prefix by SWHR2-R-0006. No enabling TASK: the outbox and worker the locked suite needs (SD2) share files with the FEATURE, so a separate ticket would only serialise the same agent's work.

### Measured code state (sprint branch at `decd492`)

- `db/schema.ts` is the only schema file (`drizzle.config.ts` → `./db/schema.ts`). The last migration is `drizzle/0004_watery_jasper_sitwell.sql`. No order, sequence, `messages` or workflow table exists.
- `services/errors.ts` already has `AppFailure`, `OrderFailure`, `EmptyCartOrder` (422), `failureReply` → `{ kind, kinds, message, trace }` and `guardRoute`. `src/errors/routeFailure.ts` maps kinds to pages, and an unmapped kind goes to the Server Error page.
- `src/pages/petstore/error/server.tsx` and `empty-cart.tsx` exist as stubs from shopping-cart. `server.tsx` shows neither the message nor the trace, and does not ask the shopper to notify the administrator, so it does not meet SWHR2-R-0003.
- `src/pages/petstore/cart.tsx:188` links Check Out to `/petstore/checkout`, a page that does not exist yet. There is no `routes/api/orders/` and no `routes/api/checkout`.
- `services/cart.ts` provides `cartFor(sessionId)`, `lines(cart, locale)`, `total` and `clearCart(sessionId)`. `services/session/guards.ts#requireCustomer` gives the 401 `SignOnRequired`.
- `services/customers/index.ts#getCustomer(userId)` and `contactSnapshot(contactId)` return the account contact as `givenName, familyName, telephone, email` with address `street1, street2, city, state, zip, country`.
- No XML library is installed, and nothing exists under `plugins/` or `services/messaging/`.
- Locked acceptance suite `tests/acceptance/checkout/` (`harness.ts`, `unit.test.ts`, `orders.test.ts`, `e2e/checkout.spec.ts`) fixes these module paths: `services/ids#nextId`, `services/documents/purchase-order#{toXml,fromXml}`, `services/orders/receive#{createPurchaseOrder,getPurchaseOrder}` and `routes/api/orders/index.post`. Three shopping-cart cases deferred here (C-0089, C-0090, C-0101) also depend on this change.

### Interface contracts fixed by the locked suite

- `POST /api/orders` body `{ billing, shipping }`. Each side is `{ givenName, familyName, street, city, state, country, zip, email, phone }`. The reply is 200 `{ orderId }`, 401 `SignOnRequired`, 422 `EmptyCartOrder`, or 500 `AppFailure` with `message` and `trace`.
- `nextId(prefix: string): string | Promise<string>`. A null or empty prefix throws and leaves `id_sequences` unchanged. It throws an `Error` when the store is closed or the sequence insert aborts. The table is `id_sequences(prefix text pk, next_value integer not null)`, and an issue increments `next_value` by 1.
- `PurchaseOrder` value: `{ orderId, userId, email, locale, orderDate (epoch ms), total (hundredths), billing, shipping, card: { cardNumber, cardType, expiryDate }, lines: [{ lineNumber, categoryId, productId, itemId, quantity, unitPrice (hundredths) }] }`. `fromXml(toXml(po))` must deep-equal `po`.
- `createPurchaseOrder(db | tx, po)` throws on a duplicate id or any failed insert and keeps nothing. `getPurchaseOrder(orderId)` returns the order.
- Tables: `op_purchase_orders`, `op_po_contacts` (shipping contact, columns include the address values), `op_po_cards`, `op_po_line_items` (`item_id`, `quantity`, `quantity_shipped`), `messages` (`channel`, `payload`, `status`), and `op_order_workflow` (`order_id`, `status`).

### Decisions

- **P1 Schema in `db/schema.ts`.** The tables go into the existing single schema file with one new migration, not into `db/schema/storefront.ts` / `order-processing.ts` (SD1).
- **P2 Minimal outbox and worker built here, in order-fulfilment's shape.** The FEATURE adds the `messages` table with the columns change `swhr2-i-0011-order-fulfilment-and-invoic` defines (`id, channel, subscriber, payload, status, attempts, available_at, created_at`). It also adds `services/messaging/` with `enqueue(tx, channel, payload)` and `plugins/message-worker.ts`, which delivers `order.new` to `services/orders/receive`. Order-fulfilment later extends this code and does not rewrite it (SD2). The worker starts only with the Nitro server, so route tests see the message `pending`, as C-0220 requires.
- **P3 Receipt starts the workflow in PENDING.** `op_order_workflow(order_id pk, status)` is created in order-fulfilment's shape. Receipt inserts `PENDING` in the same transaction as the order. Auto-approval and the approval tool belong to `swhr2-i-0009-order-approval`.
- **P4 The card on the order is the customer's account card**, not the legacy hard-coded demo card (D1, task 4.6). Expiry is written as `MM/YYYY` text. When reading, a value that does not match `<month>/<year>` leaves month and year unset; no 01/2010 substitution (task 6.2, D2). Number, type and expiry go to the stored card in that order.
- **P5 An unparseable order date rejects the document** (task 5.3). The processing date is never substituted (D7).
- **P6 Placement transaction.** `nextId` and `enqueue` run in one synchronous `db.transaction`, following the decision that data operations join the caller's transaction. The cart is cleared only after that transaction commits (task 5.5). Any throw, including the C-0212 mock that makes `nextId` throw, leaves through `guardRoute` as a 500 `AppFailure`.
- **P7 Order Placed screen is in scope.** The Order Placed mockup SWHR2-MCK-25 is approved, task 4.7 builds it, and C-0216 and C-0101 assert that the order id is shown. Route: `/petstore/order-placed`, with the order id and e-mail passed in navigation state.
- **P8 Country value `USA`, labelled "United States".** The country option value matches what the account stores, so pre-fill selects it.
- **P9 XML.** Add the `fast-xml-parser` dependency as the target design assumes. A hand-written serialiser is acceptable if it keeps element order and passes the round trip.

### Phases

1. Data model and migration (group 1).
2. Id issue (group 2).
3. Document codec (groups 5.1–5.3, 6).
4. Receipt, outbox and worker (5.4–5.7, P2, P3).
5. Placement route and `GET /api/checkout` (group 4).
6. Screens: checkout form, Order Placed, empty-cart and Server Error pages, built to the approved mockups (groups 3, 4.7, 4.8).
7. **Test harness.** Colocated unit, route and UI tests (group 7) follow the AGENTS.md table: route tests under `routes/**` run in the vitest `server` project. Add `e2e/checkout.spec.ts` for the browser flow. The locked suite `tests/acceptance/checkout/` and the shopping-cart cases C-0089, C-0090 and C-0101 must pass unmodified.
8. **CI.** No workflow change is needed: the existing CI already runs lint, typecheck, unit and E2E on `vortex/**` pushes and pull requests. The new migration must apply cleanly on a fresh in-memory database, because CI starts from one.

### Spec discrepancies

- **SD1** The target design puts tables in `db/schema/storefront.ts` and `db/schema/order-processing.ts`, but the repository has the single `db/schema.ts`, and `drizzle.config.ts` reads only that file. Resolved by P1.
- **SD2** The target design says the `messages` table and its worker come from order-fulfilment (`swhr2-i-0011-order-fulfilment-and-invoic`, a later sprint). The locked checkout suite already needs them: C-0220 queries `messages` and `op_order_workflow`, and C-0215 and C-0216 poll `op_purchase_orders` after a browser placement, which needs a running consumer. Resolved by P2 and P3.
- **SD3** The proposal and PRD open question 6 treat the Order Placed screen as unconfirmed, while tasks.md 4.7 and approved mockup SWHR2-MCK-25 include it. Resolved by P7.
- **SD4** Tasks 4.6, 5.3 and 6.2 refer to "the decided" card, date and expiry rules, but no decision is recorded. Resolved by P4 and P5 as planning decisions; the Business Owner may revise them.
- **SD5** The spec counts ten contact fields per section. The locked suite's body carries nine (`street` with no `street2`, and `phone` where the account has `telephone`). The form keeps an optional second address line, and the route maps the account names to the order names.
- **SD6** The existing `server.tsx` stub (heading "Server error", "Please try again") contradicts SWHR2-R-0003 and SWHR2-MCK-27. It is rebuilt here.
