# PLAN — SWHR2-T-0328 Flaky e2e: order-approval C-0243

Change: `swhr2-s-0035-bugfix-swhr2-t-0328-flaky-e`. Read its `design.md` FIRST (Root cause, Decisions D1–D4), then `specs/order-approval/spec.md`.

## Objective

Make `e2e/order-approval.spec.ts` pass whatever the timing. After commit and refresh it should assert the outcome that always holds: the order is listed as non-pending with an approved-or-later status, and it is gone from the pending view. It should no longer assert the transient APPROVED status.

## Steps

Work the `tasks.md` items in order. Tick nothing yourself.

1. Replace the final poll (design.md D2):
   - refresh until the order's non-pending row matches APPROVED or COMPLETED
   - assert it is neither PENDING nor DENIED
   - switch to the pending tab and assert the order is absent
2. Retitle the test (D4), keeping `[SWHR2-C-0243]`.
3. Run the spec alone and in repeated full e2e runs; change no application file (D1). Do not edit `tests/acceptance/**`.

## File/module ownership

Modify: `e2e/order-approval.spec.ts`.

## Definition of Done

AC-1 … AC-3 on the ticket, proven by the updated spec passing alone and across repeated full e2e runs.
