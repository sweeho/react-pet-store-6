## Why

The legacy Java Pet Store 1.3.2 ships a supplier web application in which an administrator views the supplier's stock, overwrites stock counts, and thereby releases supplier orders that were waiting for stock. The supplier's stock record is also what order fulfilment draws down when a line ships. The rebuild has to reproduce that stock model, the overwrite semantics, the restock-then-refulfil unit of work, and the three supplier screens. This change records the behaviour extracted from the legacy source and user guide (spec extraction SX-0001) as a reviewable delta spec. Every requirement in it is a draft until an SME approves it.

## What Changes

- Adds the `supplier-inventory` capability with 3 requirements, one per SME-approved record (SINV-ENT-0001, SUPPLIER-INVENTORY-SCR-0001, SUPPLIER-INVENTORY-SCREEN-0001):
  - one stock record per item with a mandatory whole-number quantity;
  - the supplier inventory screen's listing and update marking;
  - the supplier inventory screen's single batch submission.
- The other 6 records of the capability (SINV-BR-0001/0002/0003, SINV-WF-0001, SINV-SCR-0001, SINV-SCR-0002) are not yet approved and are Not specified here: overwrite semantics, stock draw-down on shipment, the restock unit of work, the supplier home screen, role gating and the confirmation screen. They await SME review in `legacy-analysis/ir/_recommendations/supplier-inventory.yaml`.
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
