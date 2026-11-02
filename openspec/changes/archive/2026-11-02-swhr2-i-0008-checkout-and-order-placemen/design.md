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

## Planning (sprint SWHR2-S-0026)

Added by planning on 2026-11-02. Everything above this heading is the extracted change and is unchanged. The FEATURE is SWHR2-T-0290; its plan is `artifacts/SWHR2-S-0026/SWHR2-T-0290/PLAN.md`.

### Codebase findings

- **F1 Schema is one file.** `db/schema.ts` holds every table (users, sign-on, catalog, customers). There is no `db/schema/` directory and no `messages`, `id_sequences`, `op_*` table. The last migration is `drizzle/0004_watery_jasper_sitwell.sql`.
- **F2 Database bootstrap.** `db/client.ts` runs the `drizzle/` migrations on open, enables foreign keys after migrating, uses `:memory:` under Vitest, and seeds the dev database (customer j2ee, a small catalog) only when the tables are empty.
- **F3 Failure routing exists.** `services/errors.ts` already defines `AppFailure`, `OrderFailure`, `EmptyCartOrder` and `guardRoute`, which answers any failure as an `HTTPError` whose data is `{ kind, kinds, message, trace }`.
- **F4 Screens partly exist.** `src/pages/petstore/error/empty-cart.tsx` and `error/server.tsx` exist. `server.tsx` is a static "Server error" page with no message, trace or administrator notice. `src/pages/petstore/cart.tsx` already links Check Out to `/petstore/checkout`, which has no page yet.
- **F5 Cart and session.** The cart is in memory (`services/cart.ts`, with `cartFor`, `lines`, `clearCart`), keyed by session id. `services/session/guards.ts#requireCustomer` guards customer routes. Contact and address data come from `services/customers/`.
- **F6 Locked acceptance suite (v85, commit 95e50ea).** `tests/acceptance/checkout/` (`unit.test.ts`, `orders.test.ts`, `e2e/checkout.spec.ts`, `harness.ts`) cites all 16 approved cases, SWHR2-C-0212 to SWHR2-C-0227. It fixes these module paths and exports: `services/ids#nextId`, `services/documents/purchase-order#toXml/fromXml`, `services/orders/receive#createPurchaseOrder(db, po)/getPurchaseOrder(orderId)`, and `routes/api/orders/index.post`. It also fixes these tables: `id_sequences(prefix, next_value)`, `op_purchase_orders`, `op_po_contacts`, `op_po_cards`, `op_po_line_items(item_id, quantity, quantity_shipped)`, `messages(channel, payload, status)` and `op_order_workflow(order_id, status)`. Its order shape is `harness.ts#purchaseOrder`, with lines numbered from 1.
- **F7 CI.** `.github/workflows/ci.yml` runs on pull requests to `vortex/**`. It runs the unit, acceptance (Vitest) and acceptance e2e (Playwright) tiers. No `fast-xml-parser` or other XML library is in `package.json`.

### Spec discrepancies

Recorded here and on SWHR2-T-0290. The delta spec is not edited.

- **SD1 Schema location.** The Target design places tables in `db/schema/storefront.ts` and `db/schema/order-processing.ts`. The repository keeps one `db/schema.ts` (F1). The FEATURE adds the tables to `db/schema.ts`.
- **SD2 Outbox and workflow tables come earlier than the design says.** The Target design treats the `messages` table and the order workflow as order-fulfillment's (SWHR2-I-0011). The locked cases need them now. SWHR2-C-0220 reads `messages` and queries `op_order_workflow`, which must exist. SWHR2-C-0216 (e2e) needs the order stored in the running dev server, so something must consume `order.new` and call `createPurchaseOrder`. The FEATURE therefore creates a minimal `messages` table, a minimal `op_order_workflow(order_id, status)` table, and an in-process `order.new` consumer that order-fulfillment later extends. The consumer is started by a Nitro plugin, not under Vitest. Receipt inserts the workflow row as PENDING. Auto-approval stays with order-approval (SWHR2-I-0009).
- **SD3 Line numbering.** tasks.md 4.3 and the legacy notes number lines from 0. The locked harness numbers them from 1, and the codec round trip must reproduce what it is given. The route numbers lines from 1 so the stored data matches what the tests build. No requirement in the spec states the start.
- **SD4 Seed data versus the case preconditions.** SWHR2-C-0215 and SWHR2-C-0216 expect j2ee's account to hold "1 Main St" and "abc@xyz.com". SWHR2-C-0212 (e2e) orders item EST-4. The dev seed in `db/client.ts` has "901 San Antonio Road", "j2ee@example.com" and no EST-4. Nothing else in the repository reads those values. The FEATURE aligns the j2ee seed and adds EST-4. The seed itself belongs to data-population (SWHR2-I-0014).
- **SD5 Server Error heading.** The design gives the heading as "Server Error". The existing page says "Server error" and shows neither the message nor the trace. The FEATURE rebuilds the page to the approved mockup.
- **SD6 Order Placed screen.** PRD open question 6 asks whether the screen is in scope. The approved mockup SWHR2-MCK-25 ("Order placed", "Your order number") settles it as in scope, so the FEATURE builds it at `/petstore/order-placed`.
- **SD7 Payment card (D1/D2).** tasks.md 4.6 says "as decided for the fixed-card defect". No decision is recorded. Until the Business Owner decides, the FEATURE stores the signed-on customer's account card (number, type, expiry) on the order and never charges it, and does not reproduce the legacy argument swap.

- **SD8 Order-complete heading.** The approved mockup SWHR2-MCK-25 has the h1 "Order placed". Locked case SWHR2-C-0174 (customer-account e2e) requires a heading matching "Your order is complete", which is the legacy JSP heading. SWHR2-C-0101 accepts either. The screen follows the mockup's layout and also carries a heading that reads "Your order is complete", so both hold.
- **SD9 Order of checks in placement.** tasks.md lists server-side field validation (4.1) before the empty-cart refusal (4.2). Locked case SWHR2-C-0090 (shopping-cart) posts empty billing and shipping with an empty cart and expects 422 `EmptyCartOrder`, with no row in `op_purchase_orders` or on `order.new`. The empty-cart check therefore runs before field validation.
- **SD10 Deferred cases.** Six cases deferred to this brief by earlier capabilities are linked to SWHR2-T-0290 and cited by other capabilities' locked suites: SWHR2-C-0089, C-0101 (shopping-cart e2e), C-0090 (shopping-cart integration), C-0174 (customer-account e2e), and C-0252, C-0254 (sign-on e2e). They require that Check Out reaches `/petstore/checkout` with an address form, that an unsigned visitor is sent to sign in first, and that a successful submit leaves `/petstore/checkout` for the order-complete screen and empties the cart.

### Decisions

- **P1 Outbox hand-off.** Placement writes the `PurchaseOrder` XML as one `pending` row on channel `order.new` in `messages`, inside the same synchronous transaction that issues the order id. If that insert fails, nothing is kept and the route answers 500 `AppFailure`. The cart is cleared only after the commit.
- **P2 In-process consumer.** `services/messages/` provides `enqueue(tx, channel, payload)` and a polling `startWorker(handlers)`. A Nitro plugin starts the worker in the dev and production server. Tests do not start it, which is what C-0220 relies on. The `order.new` handler calls `receiveOrder(xml)`: parse, store the order, insert the PENDING workflow row, and mark the message done in one transaction.
- **P3 Ids.** `nextId(prefix, tx?)` joins a caller's transaction or opens its own (ARCHITECTURE Key Decisions, "Data operations join the caller's transaction"). A missing, empty or null prefix throws before any database call.
- **P4 XML dependency.** Add `fast-xml-parser`, as the design proposes, with `preserveOrder` off and the element order fixed by the builder's input object.

### Phases

1. **Data model.** Add the tables to `db/schema.ts` and generate one migration (tasks 1.x).
2. **Ids and codec.** `services/ids.ts` and `services/documents/purchase-order.ts`, with unit tests (2.x, 5.1 to 5.3, 6.2, 7.1, 7.3).
3. **Receipt and outbox.** `services/messages/`, `services/orders/receive.ts`, the Nitro plugin and the workflow row (5.4 to 5.7, 6.1).
4. **Placement routes.** `GET /api/checkout` and `POST /api/orders`, with route integration tests (4.x, 7.2).
5. **Screens.** The checkout form, Order Placed, and the Server Error rebuild, with UI tests and per-locale screen text (3.x, 4.7, 4.8, 7.4).
6. **Test harness.** Align the dev seed (SD4) so the locked e2e preconditions hold on a fresh database. Run every locked case in `tests/acceptance/checkout/` green, and keep the locked shopping-cart, sign-on and customer-account suites green.
7. **CI.** No workflow change is needed (F7). The ticket's pull request into the sprint branch must pass the unit, acceptance and acceptance e2e jobs.
