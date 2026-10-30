---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0016
capability brief: SWHR2-I-0007
branch: vortex/test/SWHR2-T-0249-integration-qa-report-swhr2-s-0016-b80586a2
upstream: [artifacts/SWHR2-S-0016/integration-test-result.md]
downstream: [artifacts/SWHR2-S-0016/qa-test-report.md]
---

# Integration defects resolution — SWHR2-S-0016

## DEFECT-1 — Shopping cart not implemented

- Violates: all requirements in `shopping-cart/spec.md` except session scoping (see report).
- Evidence: `bun run test:acceptance` → 11 red tests in `tests/acceptance/shopping-cart/` (SWHR2-C-0080, 0081, 0086, 0087, 0090, 0091, 0092, 0094, 0098, 0099, 0100).
- Cause: FEATURE SWHR2-T-0247 is DEFERRED; no cart code was merged into the sprint branch.
- Fix rounds: 0. Implementing the change means new services, routes, error routing and a rebuilt screen (the whole feature), which is a restructure, not an in-place fix.
- Resolution: future-sprint DEFECT SWHR2-T-0250 filed (implementation).

| Defect   | Status    | Rounds | Future ticket |
| -------- | --------- | ------ | ------------- |
| DEFECT-1 | ESCALATED | 0      | SWHR2-T-0250  |

INTEGRATION_DEFECTS_RESOLUTION: ESCALATED
