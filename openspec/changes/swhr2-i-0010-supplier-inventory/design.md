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

**Record mapping.** `spec.md` carries only the three approved records: SINV-ENT-0001 (stock record), SUPPLIER-INVENTORY-SCR-0001 (docs pass C: listing and update marking) and SUPPLIER-INVENTORY-SCREEN-0001 (docs passes A and B: batch submission). The code-read screen records SINV-SCR-0001 (inventory page, incl. administrator-role gating and the "no items" message) and SINV-SCR-0002 (supplier home screen), the confirmation page (`back.jsp`, from SINV-WF-0001 / SINV-BR-0003) and the business rules SINV-BR-0001/0002 are pending SME approval and are Not specified; the notes in this document about them are legacy context only.

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

## Target design

### Components

- **Inventory service** `services/supplier/inventory.ts`:
  - `listInventory()` returns every stock record.
  - `updateInventory(changes: { itemId, quantity }[])` applies every change in one transaction (SWHR2-R-0126). In the same transaction it enqueues one `supplier.inventory-changed` message, which triggers re-fulfilment of waiting orders (order-fulfillment SWHR2-R-0099).
- **Supplier home** `src/pages/supplier/index.tsx` (once signed in): Display Inventory, which links to `/supplier/inventory`, and Logout.
- **Supplier inventory page** `src/pages/supplier/inventory.tsx`, guarded by supplier sign-in. It shows one row per stock record with the item, the existing quantity, an empty new-quantity input and an unchecked update marker (SWHR2-R-0125). One Submit sends only the rows whose marker is checked, so a quantity typed on an unmarked row is never sent and never saved (SWHR2-R-0125.02). The route ignores rows that are not marked.

### Data

This table is in `db/schema/supplier.ts`, and building it produces one new drizzle-kit migration in `drizzle/`.

- `sup_inventory`: `item_id` text primary key, so a second record for the same item is refused (SWHR2-R-0149.01). `quantity` is an integer, not null and with no default, so a save without a quantity is refused (SWHR2-R-0149.02).

The supplier group holds no foreign key into the storefront catalog tables (data-population). The seed data set is what keeps item ids aligned.

### Interfaces

- `GET /api/supplier/inventory` (supplier) → `[{ itemId, quantity }]`.
- `POST /api/supplier/inventory` (supplier): body `{ rows: [{ itemId, quantity, marked }] }`. It applies the marked rows together in one transaction and returns the refreshed list. A marked row whose quantity is not a whole number returns 400 and saves nothing (SWHR2-R-0149).
- `supplier.inventory-changed` channel payload: `{ itemIds: string[] }`, consumed in-process by the supplier fulfilment step.

### Stack choices

- Drizzle ORM over SQLite (`drizzle-orm/bun-sqlite`) with `db.transaction()` for the batch update.
- Nitro (H3) routes under `routes/api/supplier/` behind `requireSupplier` (sign-on).
- The persisted outbox carries the change notification (PRD constraints).
- A Vite React SPA page with Tailwind and the shadcn/ui-style primitives.
- Tests: route integration tests for the duplicate record, the missing quantity, the unmarked row not saved and the two marked rows saved together; a UI test for the row controls.

## Planning (SWHR2-S-0028)

Ticket: SWHR2-T-0299 (FEATURE) owns every task group. The locked acceptance suites (`tests/acceptance/supplier-inventory/`, plus the supplier steps in `sign-on`, `order-fulfillment` and `data-population`) fix route files, table and column names and the request shape. Where they and the Target design above differ, the locked suites win, and each difference is listed under Spec discrepancies.

### Codebase findings

- F1. No stock table exists. The schema is the single file `db/schema.ts` (messages and `op_*` tables at the end); the latest migration is `drizzle/0006_cool_mojo.sql`, so this change adds `0007`.
- F2. Supplier sign-on is built: `routes/api/supplier/{session.get,sign-in.post,sign-out.post}.ts`, `requireSupplier` in `services/session/guards.ts`, the area layout `src/pages/supplier.tsx` and `src/pages/supplier/index.tsx`. When signed in, it shows the placeholder "Supplier inventory will appear here once it ships." Its test is `src/pages/supplier/index.test.tsx`.
- F3. The global navigation already has "Supplier inventory" → `/supplier` (`src/components/shell/areas.ts`); no change needed.
- F4. The outbox is `services/messaging#enqueue(exec, channel, payload)`. `services/messaging/worker.ts#processDue` skips a channel with no registered handler, so its rows stay `pending` until a handler exists.
- F5. Locked names: `routes/api/supplier/inventory.get` returns `[{ itemId, quantity }]`; `routes/api/supplier/inventory.post` takes `{ rows: [{ itemId, quantity, marked }] }` and answers 200; table `sup_inventory (item_id, quantity)`. Order-fulfillment's harness drives `services/supplier/fulfil` and `services/supplier/orders` (change `swhr2-i-0011-order-fulfilment-and-invoic`) and enqueues `supplier.inventory-changed` `{ itemIds }` itself. Data-population seeds `sup_inventory` directly.
- F6. Sign-on e2e opens `/supplier/inventory` while signed out (or while an administrator is signed in) and expects the supplier sign-in form or the existing refusal, and no row holding a textbox.
- F7. The locked e2e finds a row with `getByRole("row").filter({ hasText: "EST-1" }).first()`, which also matches EST-10 to EST-19. Rows must list in natural item order (EST-1, EST-2, …, EST-10), as mockup SWHR2-MCK-33 does.

### Spec discrepancies

- SD1. **Who uses the screen.** The proposal, stories S1/S2 and tasks 5.4 and 6.1 say "administrator role" (the legacy `web.xml`). The brief, PRD, shell and sign-on spec name the supplier, and `requireSupplier` already guards `/api/supplier/**`. Built: both routes call `requireSupplier`. A signed-out visitor to `/supplier/inventory` is sent to `/supplier` (sign-in). An administrator gets the existing "sign out of Administration first" refusal. The legacy text "not authorised to update the status of orders" (D6) is not reproduced.
- SD2. **Schema location.** The Target design puts the table in `db/schema/supplier.ts`; the repository has one `db/schema.ts` (F1). Built: `supInventory` is added to `db/schema.ts`.
- SD3. **Negative and non-whole quantities (Q1, tasks 2.3/2.4).** Task 2.3 silently ignores a negative quantity. The Target design returns 400 for a non-whole number, and case C-0043 step 3 expects a submission with an invalid (e.g. negative) quantity to save nothing. Built: a marked row whose quantity is negative, fractional or non-numeric makes the whole submission 400 `InvalidQuantity`, and nothing is saved. A marked row with a blank quantity, and every unmarked row, is ignored without a message.
- SD4. **Unknown item ids (Q2, task 2.5).** The locked e2e seeds stock by POSTing marked rows for EST-1..3, which may have no record yet. C-0043 step 3 suggests a deleted record should fail the submission. Built: a marked row for an item with no stock record creates it (upsert). The SME may reverse this; it is one branch in `updateInventory`.
- SD5. **Draw-down, re-fulfilment and invoices (groups 3, 4.2, 4.3, 7.2, 7.3).** No requirement of this change covers them. Order-fulfillment owns them: its locked harness drives `services/supplier/fulfil` and consumes `supplier.inventory-changed` (F5). This FEATURE delivers the stock side only. That means `reduceStock` (group 3), whose missing-record and short-stock cases leave stock untouched, and the restock unit of work: the stock changes and one `supplier.inventory-changed` message commit or roll back together (4.1, 4.4). Re-fulfilment and invoicing (4.2, 4.3) happen when order-fulfillment registers its consumer. Until then the message waits `pending` (F4). The lines are tagged to this FEATURE because the gate requires every line to name a ticket.
- SD6. **Confirmation screen (task 5.7).** Not specified (legacy `back.jsp`, pending SME). Built: after a successful Submit, the inventory page shows "Inventory updated" with the refreshed list, a Display Inventory action that clears the confirmation, and Logout. There is no separate route.
- SD7. **Empty inventory versus read failure (Q3, task 5.5).** Built: no stock records shows "There are no items in inventory."; a failed read shows the shared `ErrorFrame`, never the empty message (D5).

### Decisions

- P1. **Table.** `sup_inventory`: `item_id` text primary key, `quantity` integer not null, no default, plus a check that `typeof(quantity) = 'integer'`. There is no foreign key to the catalog (Target design § Data). Migration `0007` from `db:generate`.
- P2. **Service** `services/supplier/inventory.ts`, the only writer of `sup_inventory` outside seeding. Every function takes an optional executor and otherwise opens its own transaction (ARCHITECTURE.md Key Decisions):
  - `listInventory(exec?): { itemId: string; quantity: number }[]` sorts in natural item order (F7).
  - `updateInventory(changes: { itemId: string; quantity: number }[], exec?): void` upserts every change. When there is at least one change, it enqueues one `supplier.inventory-changed` message `{ itemIds }`, all in one transaction (SD4, SD5).
  - `reduceStock(exec, itemId, quantity): boolean` returns false and changes nothing when the record is missing or holds less than `quantity`. Otherwise it subtracts and returns true. Order-fulfillment calls it inside its shipping transaction.
- P3. **Routes**, both `requireSupplier`:
  - `GET /api/supplier/inventory` → `listInventory()`.
  - `POST /api/supplier/inventory` reads `{ rows }` and keeps the marked rows with a non-blank quantity. If any kept quantity is not a whole number ≥ 0 (a number, or a string of digits), it answers 400 with the existing failure reply, kind `InvalidQuantity`, and saves nothing. Otherwise it calls `updateInventory` and answers 200 with the refreshed list. A body without a `rows` array is 400.
- P4. **Supplier home** (`src/pages/supplier/index.tsx`, signed-in state, mockup SWHR2-MCK-32). Heading "Supplier home" with the explanation line, an Inventory card with a **Display Inventory** link to `/supplier/inventory`, and a "Finished?" card with **Logout** (the existing sign-out). The sign-in state is unchanged.
- P5. **Inventory page** `src/pages/supplier/inventory.tsx` (route `/supplier/inventory`, mockup SWHR2-MCK-33). It shows a table with columns Item | Quantity on hand | New quantity | Update. Each row has a textbox (empty) and a checkbox (unticked), each with an accessible name that includes the item id. The page also has a marked-row count, one **Submit** button, a Supplier home link and the footnote "Quantities are whole numbers of units."
  - Submit posts every row with its `marked` flag in one request.
  - Behaviour on each reply: a 401 goes to `/supplier`; a 400 shows an inline alert and keeps the entries; success follows SD6.
  - Loading and error states use `useApi` and the shared frames, and the empty state is SD7.
  - Screen text is English only, like the administration tool.

### Phases

1. Table and migration (P1); service (P2) with its unit tests.
2. Routes (P3) with route integration tests.
3. Home and inventory pages (P4, P5) against the mockups.
4. **Test harness.** Colocated tests per the AGENTS.md table:
   - `services/supplier/inventory.test.ts`: overwrite, upsert, zero quantity, `reduceStock` for sufficient, exact, short and missing stock, and the message enqueued with the change and rolled back with it.
   - `routes/api/supplier/inventory.test.ts`: guard, unmarked and blank rows ignored, two marked rows saved together, invalid quantity saves nothing.
   - `src/pages/supplier/inventory.test.tsx`, plus updates to `src/pages/supplier/index.test.tsx`.
   - The locked suites under `tests/acceptance/**` are not edited.
5. **E2E.** `e2e/supplier-inventory.spec.ts` (task 7.5): sign in as supplier, Display Inventory, set one marked row and one unmarked row, Submit, see the confirmation, and after Display Inventory the marked row holds its new value while the unmarked one is unchanged.
6. **CI.** No workflow change. The existing CI runs lint, typecheck, unit, Playwright and the locked acceptance tiers on `vortex/**` pushes and pull requests, and picks up the new specs by path.
