## Why

The legacy Java Pet Store 1.3.2 fulfils customer orders across three cooperating applications (storefront, Order Processing Center, Supplier) that talk over asynchronous messaging. The rules that decide when a line ships, when an order is complete, what an invoice carries and what an exchanged document must contain are spread across six modules and are written down almost nowhere outside the code. Spec extraction SX-0001 recovered them as 93 IR records under the `order-fulfillment` capability. This change states them as verifiable requirements so the rebuild can match production behaviour instead of re-inventing it.

## What Changes

- Add the `order-fulfillment` capability as a delta spec: 46 requirements covering the staged order flow, the order workflow status store and lifecycle, order lines, supplier orders, the trading-partner supplier-order and invoice documents, supplier-side fulfilment and invoicing, and the application of invoices to customer orders.
- Record the legacy implementation, the record-to-requirement trace, cross-source conflicts and suspected legacy defects in `design.md`.
- Recommend an SME decision for every extracted record in `legacy-analysis/ir/_recommendations/order-fulfillment.yaml`.
- No requirement carries an `ID:` line: no record of this capability is approved yet.

## Capabilities

### New Capabilities

- `order-fulfillment`: what happens to an order after the customer submits it: hand-off to order processing, workflow status tracking, dispatch to the supplier, whole-line fulfilment from supplier stock, re-fulfilment on restock, invoicing, and completion of the customer order.

### Modified Capabilities

- none

## Impact

- Legacy sources read: `src/apps/supplier`, `src/components/processmanager`, `src/components/purchaseorder`, `src/components/supplierpo`, `src/components/lineitem`, `src/components/contactinfo`, `src/components/xmldocuments`, `setup.xml`, `docs/`.
- Adjacent capabilities whose records touch the same code: `checkout` (purchase order capture, line item storage), `order-approval` (approval decision and the PENDING-to-APPROVED/DENIED transition), `customer-notifications` (completed-order e-mail), `inventory` (supplier stock maintenance). Their rules are not restated here.
- The record set has colliding record keys across modules; see `design.md` "Extraction findings".
