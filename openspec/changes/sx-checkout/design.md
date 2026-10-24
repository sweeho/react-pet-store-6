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
