## Why

The project e2e spec for SWHR2-C-0243 (`e2e/order-approval.spec.ts`) fails intermittently under a full parallel run and passes when run alone (defect SWHR2-T-0328, raised in sprint SWHR2-S-0034). It approves a real order and then waits for its non-pending row to read APPROVED. The in-process order worker fulfils an approved, in-stock order and moves it to COMPLETED within a few seconds, so the spec only passes if its refresh lands before fulfilment. The specified behaviour is also silent on this case: SWHR2-R-0087.02 says the order appears "with status APPROVED", which a live store stops showing once the order has shipped.

## What Changes

- Add a regression scenario to the order-approval requirement "Pending and non-pending order views": an order approved since the last load and fulfilled before the refresh appears in the non-pending view with status COMPLETED, and not in the pending view.
- Fix the e2e spec to assert the outcome that holds whatever the timing: after commit and refresh the order is listed in the non-pending view as APPROVED or COMPLETED (never PENDING or DENIED), and no longer in the pending view.
- No application change.

## Impact

- Affected capability: `order-approval` (MODIFIED requirement "Pending and non-pending order views").
- Code: `e2e/order-approval.spec.ts` only. The fulfilment pipeline, the admin tool and the locked acceptance suites are untouched.

## Follow-ups / out of scope

- None. The locked `tests/acceptance/order-approval/e2e/tool.spec.ts` and `tests/acceptance/sales-reporting/e2e/tool.spec.ts` also assert APPROVED after a refresh, but they stub the admin API with `page.route`, so the worker cannot race them.
