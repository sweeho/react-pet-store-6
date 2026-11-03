---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0036
capability_brief: SWHR2-I-0017
branch: vortex/test/SWHR2-T-0335-integration-qa-report-swhr2-s-0036-29336c98
upstream: [artifacts/SWHR2-S-0036/SWHR2-T-0333/fix-note.md]
---

Command: `bun run build` (exit 0), then `bun run test:e2e -- --project=chromium`
Summary: `24 passed (14.3s)`

| Spec                                                                       | Result |
| -------------------------------------------------------------------------- | ------ |
| e2e/pet-map.spec.ts (700px and 1800px, alignment + click-through, 4 tests) | pass   |
| e2e/localization.spec.ts                                                   | pass   |
| e2e/order-approval.spec.ts                                                 | pass   |
| e2e/smoke.spec.ts                                                          | pass   |
| e2e/supplier-inventory.spec.ts                                             | pass   |

No failures, no skips.

E2E-RESULT: chromium 24 passed, 0 failed, 0 skipped
