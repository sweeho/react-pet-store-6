## 1. Order intake and automatic approval

- [ ] 1.1 Persist every newly received order and start its workflow as PENDING before any approval decision, and verify an integration test
- [ ] 1.2 Implement US auto-approval strictly below 500 and verify tests at 499.99, 500.00 and 612.50
- [ ] 1.3 Implement Japan auto-approval strictly below 50000 and verify tests at 49999 and 50000
- [ ] 1.4 Leave orders in every other locale pending and verify a zh_CN test with a small total

## 2. Decision delivery

- [ ] 2.1 Provide a durable asynchronous channel carrying approval decisions into order processing and verify a queued decision survives until consumed
- [ ] 2.2 Deliver an administrator's committed decisions as one message on that channel and verify the sender does not wait for the consumer
- [ ] 2.3 Define the approval batch entry status as free text and verify a batch with an unlisted status is read without a format error

## 3. Administrator order views

- [ ] 3.1 Build the pending-orders view and the separate non-pending view (APPROVED, DENIED, COMPLETED) and verify a UI test splits orders correctly
- [ ] 3.2 Reload the non-pending view on request and verify a newly approved order appears
- [ ] 3.3 Colour-code pending-list statuses (APPROVED green, DENIED red, PENDING yellow) and verify a UI test

## 4. Batch decisions

- [ ] 4.1 Let the administrator select pending orders and mark each approved or denied without changing stored status, and verify a UI test
- [ ] 4.2 Apply all marked decisions together on commit and verify a UI test

## 5. Tool-wide behaviour

- [ ] 5.1 Load the four status lists and the revenue and order-count chart data on start and on refresh, and verify a UI test
- [ ] 5.2 Warn before a refresh that would discard uncommitted markings and verify the cancel, confirm and nothing-uncommitted paths
- [ ] 5.3 Disable the approve, deny, commit, chart-submit, refresh, about and exit actions and show the retrieving or updating message during a request, and verify a UI test
- [ ] 5.4 Re-enable the actions once a reply has been applied and verify a UI test

## 6. End-to-end

- [ ] 6.1 Add an E2E spec in which a US order of 612.50 stays pending, is approved and committed by an administrator, and appears in the non-pending view
