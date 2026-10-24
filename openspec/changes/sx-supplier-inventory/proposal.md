## Why

The legacy Java Pet Store 1.3.2 ships a supplier web application in which an administrator views the supplier's stock, overwrites stock counts, and thereby releases supplier orders that were waiting for stock. The supplier's stock record is also what order fulfilment draws down when a line ships. The rebuild has to reproduce that stock model, the overwrite semantics, the restock-then-refulfil unit of work, and the three supplier screens. This change records the behaviour extracted from the legacy source and user guide (spec extraction SX-0001) as a reviewable delta spec. Every requirement in it is a draft until an SME approves it.

## What Changes

- Adds the `supplier-inventory` capability with 10 draft requirements extracted from 9 distinct IR record keys (5 code-read records and 4 screen records, 2 of the screen records coming from the user guide):
  - one stock record per item with a mandatory whole-number quantity;
  - inventory update overwrites (never adds to) the quantity of marked rows; blank, negative and unmarked entries are ignored;
  - stock is reduced by the full line quantity when a line ships, and not at all when stock is short;
  - an inventory update re-attempts every pending supplier order and sends invoices in one unit of work, then confirms;
  - the supplier home screen, and the inventory screen split into display, batch submission and update marking.
- Carries the legacy defects and the pass A / pass B record-key collision to the SME. They are listed in `design.md` and in `legacy-analysis/ir/_recommendations/supplier-inventory.yaml`.

## Capabilities

### New Capabilities

- `supplier-inventory`: The supplier's per-item stock, its manual update by an administrator, and its draw-down when supplier order lines ship.

### Modified Capabilities

- None.

## Impact

- New spec: `specs/supplier-inventory/spec.md`.
- Related capabilities, extracted separately: `order-fulfillment` (line-by-line shipping, order completion, invoice content and delivery), `data-population` (seeding and forced reset of stock to 10000), `sign-on` (the administrator-only constraint over the supplier area and its login form).
- Open SME decisions that change what gets built: how a non-numeric quantity is handled, whether an unknown item id should abort the whole update, whether a read failure should keep masquerading as an empty inventory, and the wording of the not-authorised message.
