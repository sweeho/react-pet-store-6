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
