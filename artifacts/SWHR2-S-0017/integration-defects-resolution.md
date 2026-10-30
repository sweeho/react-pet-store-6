---
artifact: integration-defects-resolution
spec: 1
status: escalated
author_role: validation
sprint: SWHR2-S-0017
capability brief: SWHR2-I-0007
branch: vortex/sprint/swhr2-s-0017-002e294d
upstream: [artifacts/SWHR2-S-0017/SPRINT-PLAN.md]
---

# Integration defects resolution — SWHR2-S-0017

## DEFECT-1: shopping cart operations, screen and failure routing not built

- Scenarios violated: SWHR2-R-0033.01-02, R-0145.01, R-0146.01-02, R-0147.01, R-0117.02, R-0116.01-03, R-0115.01-04.
- Evidence: FEATURE SWHR2-T-0247 is DEFERRED and SWHR2-T-0248 CANCELLED, so the sprint branch holds only the earlier add-only stub (`services/cart.ts`, `routes/api/cart/*`, read-only `src/pages/petstore/cart.tsx`).
- Fix rounds: 0. Building remove, set-quantity, Update Cart, order-emptying, error-page routing and the mockup-matching screen is a feature, not a fix in place.
- Resolution: ESCALATED, future-sprint DEFECT SWHR2-T-0255.

## DEFECT-2: flaky account e2e

- Scenario violated: none (account feature from SWHR2-S-0015, not part of this change). Spec gap: not applicable.
- Evidence: failed in the full run, passed on one targeted re-run; see `integration-test-result.md`.
- Fix rounds: 0. Disagreement across runs is the finding, so no further runs.
- Resolution: ESCALATED, future-sprint DEFECT SWHR2-T-0256.

| Defect   | Status    | Rounds | Ticket       |
| -------- | --------- | ------ | ------------ |
| DEFECT-1 | Escalated | 0      | SWHR2-T-0255 |
| DEFECT-2 | Escalated | 0      | SWHR2-T-0256 |

INTEGRATION_DEFECTS_RESOLUTION: ESCALATED
