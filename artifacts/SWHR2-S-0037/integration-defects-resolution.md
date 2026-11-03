---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0037
---

# Integration defects resolution — SWHR2-S-0037

No defects found in the project's own E2E, unit, lint, typecheck or build. Acceptance-suite observations (C-0039 selector ambiguity in the locked test; cold-start empty-body flake on first acceptance run) are UAT warnings, recorded in qa-test-report.md, not fixed here.

| Defect | Rounds | Resolution | Ticket |
| ------ | ------ | ---------- | ------ |

## QA rework round 1 (SWHR2-T-0342)

Head 59244c8. Cause: 11 cases uncited in the official run; the six e2e ones had no keyed browser test. Fix: keyed e2e/localization.spec.ts titles and added C-0295, C-0298, C-0300 tests. Result: 8 e2e passed locally; official result at next run.

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
