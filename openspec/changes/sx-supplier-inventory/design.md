## Context

This document records how the LEGACY Java Pet Store 1.3.2 implements supplier inventory. It does not propose a target design; the Architect drafts that once the Product Requirement is approved. See `proposal.md` for motivation and `specs/supplier-inventory/spec.md` for the behaviour.

All code lives in the supplier application, `legacy-source/petstore1.3.2/src/apps/supplier/src`:

| Concern            | Legacy location                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Stock entity       | `InventoryEJB` (CMP 2.x, `ejb-jar.xml` lines 49-80); table DDL in `sun-j2ee-ri.xml` line 396                                    |
| Screens            | `docroot/index.jsp` (home), `docroot/displayinventory.jsp` (inventory), `docroot/back.jsp` (confirmation)                       |
| Screen data        | `inventory/web/DisplayInventoryBean.java` (session-scoped bean, `findAllInventoryItems`)                                        |
| Request dispatcher | `inventory/web/RcvrRequestProcessor.java` (servlet; `doGet`/`doPost`, `updateInventory`, `sendInvoices`)                        |
| Fulfilment         | `orderfulfillment/ejb/OrderFulfillmentFacadeEJB.java` (`checkInventory` lines 120-139, `processPendingPO` lines 247-269)        |
| Access control     | `docroot/WEB-INF/web.xml` lines 91-104 (`/RcvrRequestProcessor` restricted to role `administrator`, FORM login, transport NONE) |
| User guide         | `legacy-source/petstore1.3.2/docs/using.html` lines 267-288, "Managing the Supplier / Viewing and Editing Inventory"            |

## Legacy implementation notes

**Stock entity.** `InventoryEJB` has two CMP fields: `itemId` (String, primary key) and `quantity` (int). The container creates `InventoryEJBTable("itemId" VARCHAR(255), "quantity" INTEGER NOT NULL, PRIMARY KEY ("itemId"))`. There is no CHECK constraint, so a negative quantity is storable; the only floor is the comparison in `checkInventory`. `reduceQuantity(n)` sets `quantity - n` with no floor of its own. An `addQuantity` method exists only as commented-out code, so there is no additive path anywhere.

**Routing.** Every screen is served by one servlet keyed on a `currentScreen` form field (`displayinventory`, `updateinventory`, `logout`). A GET is forwarded to `index.jsp` by setting an instance field `fromDoGet` and calling `doPost` (see defect D4). The welcome file links to the servlet, which is how "a plain request to the supplier area" reaches the home screen.

**Inventory screen.** `displayinventory.jsp` re-checks `request.isUserInRole("administrator")` in a scriptlet even though `web.xml` already restricts the servlet to that role, so the not-authorised branch is effectively reachable only if the declarative constraint is changed. The not-authorised text is "You are not authorised to update the status of orders." (copied from another screen; D6). Rows come from EJB-QL `SELECT OBJECT(a) FROM Inventory a` with no ORDER BY, so row order is whatever the database returns. Inputs are named `qty_<itemId>` (text, size 6) and `item_<itemId>` (checkbox, value "false"; only its presence matters). The page heading instructs: enter the new quantity, check the adjacent box, and when all updates are done click submit. The "no items in inventory" message is rendered only when `getInventory()` returns null, which happens only when the lookup throws; an empty inventory renders the column headers and Submit with no rows (D5).

**Update handler.** `updateInventory` iterates request parameter names starting with `item_`, reads `qty_<id>`, skips null/empty, parses with `new Integer(...)`, and calls `setQuantity` when the value is >= 0. Parameter iteration order is container-defined.

**Restock unit of work.** For `currentScreen=updateinventory` the servlet begins a bean-managed `UserTransaction`, calls `updateInventory`, `OrderFulfillmentFacade.processPendingPO()` (orders with status PENDING), and `sendInvoices` (through the supplier-order transition delegate, which publishes to a JMS topic), then commits and forwards to `back.jsp`. Invoice publishing uses a non-transacted session, so invoices are not actually rolled back with the transaction (see the order-fulfillment change).

**Fulfilment draw-down.** `checkInventory` looks up the stock record (a missing record returns false with no error), returns false when `quantity < lineQuantity`, and otherwise calls `reduceQuantity(lineQuantity)`. Both run under the `Required` container transaction.

**Record mapping.** The four screen requirements trace to: Supplier home screen ← SINV-SCR-0002; Supplier inventory screen display ← SINV-SCR-0001; batch submission ← SUPPLIER-INVENTORY-SCREEN-0001 (docs passes A and B); update marking ← SUPPLIER-INVENTORY-SCR-0001 (docs pass C). The two docs records describe the same page as SINV-SCR-0001 from the user guide; their submission and marking statements are the parts the guide states explicitly, so each is kept as its own requirement. The confirmation screen (`back.jsp`) has no screen record of its own; it is specified from SINV-WF-0001 / SINV-BR-0003.

**Record-key collision.** Code passes A and B minted the same keys for different rules: SINV-BR-0001 is "update replaces quantity" in pass A but "reduce stock when a line ships" in pass B, and SINV-BR-0002 is the reverse. Pass B's SINV-BR-0003 duplicates pass A's SINV-WF-0001. The spec carries each rule once regardless of key; the SME should settle the key assignment (see the recommendations file).

## Suspected legacy defects

These are recorded as what the code does; whether each is right is the Business Owner's decision in the defect register.

- **D1** Update errors are swallowed: every checked exception in the update path is printed and dropped, with no rollback and no response page, leaving the transaction to time out. A non-numeric quantity raises an uncaught `NumberFormatException` after the transaction began. (`RcvrRequestProcessor.java` 126, 179-207)
- **D2** An unknown item id ends the update loop at that item; earlier updates, the pending-order run and the success page still proceed, so a partial update commits. (115-137)
- **D3** Invoice publish failures after a restock are swallowed and the transaction commits with lines marked shipped (shared with order-fulfillment). (139-157)
- **D4** `fromDoGet` is a servlet instance field shared across threads, so concurrent requests can be routed to the wrong branch, losing an inventory update. (85, 159-172)
- **D5** A read failure is displayed as "There are no items in inventory at all", and a genuinely empty inventory does not show that message. (`DisplayInventoryBean.java` 76-88)
- **D6** The not-authorised message refers to updating "the status of orders". (`displayinventory.jsp` 121-125)

## Open questions for the SME

- **Q1** What should happen to a non-numeric or fractional quantity entry: reject with a message, or ignore like a negative one? The legacy behaviour is a server error.
- **Q2** Should an unknown or since-deleted item id abort the whole update, be skipped, or be reported?
- **Q3** Should the "no items" message be shown for an empty inventory, with a distinct error for a read failure?
- **Q4** Is the per-row update marker still wanted, or should any changed quantity be applied? The user guide and code both require it today.
