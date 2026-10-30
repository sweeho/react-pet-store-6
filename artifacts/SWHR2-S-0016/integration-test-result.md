---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0016
capability brief: SWHR2-I-0007
branch: vortex/test/SWHR2-T-0249-integration-qa-report-swhr2-s-0016-b80586a2
upstream: [artifacts/SWHR2-S-0016/SPRINT-PLAN.md]
downstream: [artifacts/SWHR2-S-0016/qa-test-report.md]
---

# Integration test result — SWHR2-S-0016

Command: `bun run test:e2e` (preflight, exit 1) then `bunx playwright test --project=chromium` (exit 1).

Result: the E2E suite did not run. Preflight: "Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome)". The container has chromium-1223 only. Running playwright directly failed in `e2e/global-setup.ts:20` at `chromium.launch()` for the same reason. No spec executed; no pass is claimed. The sprint also adds no `e2e/cart.spec.ts` (feature ticket SWHR2-T-0247 was deferred).

| Spec               | Result                    |
| ------------------ | ------------------------- |
| all e2e/\*.spec.ts | not run (browser missing) |

E2E-RESULT: chromium 0 passed, 0 failed, 0 skipped
