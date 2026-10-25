## 1. Stock data model

- [ ] 1.1 Define the supplier stock record keyed uniquely by item identifier with a mandatory whole-number quantity
- [ ] 1.2 Generate and commit the migration for the stock record
- [ ] 1.3 Implement set-quantity (overwrite) on a stock record
- [ ] 1.4 Implement reduce-quantity by a line amount on a stock record
- [ ] 1.5 Implement the list-all-stock-records query

## 2. Inventory update rules

- [ ] 2.1 Parse a submitted inventory update into marked rows with their entered quantities
- [ ] 2.2 Apply overwrite for marked rows with a non-empty quantity of zero or more
- [ ] 2.3 Ignore unmarked rows, blank quantities and negative quantities without a message
- [ ] 2.4 Apply the SME decision on non-numeric quantity entries (Q1)
- [ ] 2.5 Apply the SME decision on unknown item identifiers in an update (Q2)

## 3. Fulfilment draw-down

- [ ] 3.1 Reduce stock by the full line quantity when a line ships, in the same unit of work that marks it shipped
- [ ] 3.2 Leave stock untouched when stock on hand is below the line quantity
- [ ] 3.3 Treat a missing stock record as insufficient stock

## 4. Restock unit of work

- [ ] 4.1 Wrap stock changes, pending-order re-fulfilment and invoice sending in one unit of work
- [ ] 4.2 Re-attempt fulfilment of every pending supplier order after the stock changes are applied
- [ ] 4.3 Send one invoice per order that shipped at least one line in the attempt
- [ ] 4.4 Roll back and report failure when any step of the unit of work fails

## 5. Supplier screens

- [ ] 5.1 Build the supplier home screen with its explanation, Display Inventory and Logout actions
- [ ] 5.2 Route a plain request to the supplier area to the home screen
- [ ] 5.3 Build the inventory screen list with item identifier, existing quantity, new-quantity field and update marker per row
- [ ] 5.4 Show the not-authorised message to users outside the administrator role
- [ ] 5.5 Show the "no items in inventory" state per the SME decision on read failures (Q3)
- [ ] 5.6 Submit all marked rows together from a single Submit control
- [ ] 5.7 Build the update confirmation with Display Inventory and Logout actions

## 6. Access control

- [ ] 6.1 Restrict the supplier area and the inventory update endpoint to the administrator role

## 7. Tests

- [ ] 7.1 Unit-test overwrite, ignore and zero-quantity update rules
- [ ] 7.2 Unit-test fulfilment draw-down for sufficient, exact and insufficient stock
- [ ] 7.3 Integration-test the restock unit of work releasing a pending order and sending its invoice
- [ ] 7.4 UI-test the home, inventory and confirmation screens including the not-authorised and empty states
- [ ] 7.5 End-to-end test a supplier restock from home screen to confirmation
