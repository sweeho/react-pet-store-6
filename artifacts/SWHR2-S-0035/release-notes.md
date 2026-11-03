---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0035
capability_brief: none
branch: vortex/sprint/swhr2-s-0035-c80de065
upstream: [artifacts/SWHR2-S-0035/qa-test-report.md]
---

# Release notes — SWHR2-S-0035

## Fixed

- **Order-approval browser test no longer fails at random.** The end-to-end test for approving an order failed in full test runs when the store shipped the order before the test looked at it. It now checks that an approved order is listed as approved or completed and has left the pending list, whatever the timing. (SWHR2-T-0328)

## Changed

- Nothing a shopper, administrator or supplier can see. This release changes tests only.

## Upgrade notes

- No migration, configuration or dependency change.
