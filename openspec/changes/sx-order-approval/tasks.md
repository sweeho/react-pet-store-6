## 1. Data model

- [ ] 1.1 Define the order status set PENDING, APPROVED, DENIED, COMPLETED and verify a unit test rejects any other value
- [ ] 1.2 Expose the administrator's order view (id, user id, date, amount, status) and verify a unit test covers each field
- [ ] 1.3 Define the approval decision batch (one or more entries of order id plus new status) and verify tests reject an empty batch, a missing or empty id, and a missing or empty status
- [ ] 1.4 Ensure a batch cannot be built with a null id or status and verify a round-trip test reads back every batch that can be written

## 2. Automatic approval

- [ ] 2.1 Record every newly received order as PENDING and verify an integration test
- [ ] 2.2 Implement US auto-approval below 500 and verify tests at 499.99, 500.00 and 612.50
- [ ] 2.3 Implement Japan auto-approval below 50000 and verify tests at 49999 and 50000
- [ ] 2.4 Leave orders in every other locale pending and verify a zh_CN test with a small total
- [ ] 2.5 Route an auto-approval through the same decision-delivery path as administrator decisions and verify an integration test

## 3. Order queries

- [ ] 3.1 Implement retrieve-orders-by-status with exact matching and no duplicates and verify an integration test
- [ ] 3.2 Return the requested status, the count and each order's fields and verify the reply shape in a route test

## 4. Decision submission and delivery

- [ ] 4.1 Accept a status update batch and build one decision batch, skipping incomplete entries, and verify a route test
- [ ] 4.2 Reply SUCCESS once the batch is handed to order processing and verify a route test
- [ ] 4.3 Reply with a try-again error when the hand-off fails and verify a route test
- [ ] 4.4 Deliver each batch asynchronously as one message on the order-approval channel and verify the sender does not wait for the consumer
- [ ] 4.5 Validate incoming batches against the schema by default with an explicit opt-out and verify both settings in tests

## 5. Process Pending Orders screen

- [ ] 5.1 Build the pending-orders list (ID, User ID, Date, Amount, Status; PENDING only; sortable) and verify a UI test
- [ ] 5.2 Make Status the only editable value with choices PENDING, APPROVED, DENIED and verify a UI test
- [ ] 5.3 Colour-code statuses (APPROVED green, DENIED red, PENDING yellow) and verify a UI test
- [ ] 5.4 Add Approve and Deny controls that mark all selected rows locally and verify a UI test shows no request is sent
- [ ] 5.5 Add the Commit control that sends approvals then denials, skips PENDING rows and sends nothing when nothing is marked, and verify a UI test
- [ ] 5.6 Reload the order lists after commit and verify decided orders leave the pending list

## 6. View Non-Pending Orders screen

- [ ] 6.1 Build the read-only list of APPROVED, DENIED and COMPLETED orders (sortable) and verify a UI test
- [ ] 6.2 Reload it on refresh and verify a newly committed decision appears

## 7. Tool-wide behaviour

- [ ] 7.1 Load all four status lists on start and on refresh and verify a UI test
- [ ] 7.2 Warn before a refresh that would discard uncommitted markings and verify the cancel and confirm paths
- [ ] 7.3 Disable actions and show the loading or updating message while a request is in flight and verify a UI test
- [ ] 7.4 Handle a failed load or commit as the approved requirement states and verify a UI test

## 8. End-to-end

- [ ] 8.1 Add an E2E spec in which a US order of 612.50 stays pending, is approved by an administrator, and moves to the non-pending list
