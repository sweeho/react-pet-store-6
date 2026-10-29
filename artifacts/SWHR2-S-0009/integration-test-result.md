---
artifact: integration-test-result
sprint: SWHR2-S-0009
ticket: SWHR2-T-0163
author: validation
---

# Integration test result — SWHR2-S-0009

Command: `bun run test:e2e` (Playwright; `bunx playwright test --list` lists 12 tests in 4 files, chromium).

Output (verbatim):

```
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

The preflight failed, so Playwright never launched and no spec ran. This is an environment limitation (no browser in this container), not a product failure. The instructions forbid installing a browser. Nothing is claimed as passed.

| Spec                                                 | Result  |
| ---------------------------------------------------- | ------- |
| e2e/smoke.spec.ts                                    | not run |
| e2e/home.spec.ts                                     | not run |
| e2e/localization.spec.ts                             | not run |
| e2e/catalog.spec.ts                                  | not run |
| tests/acceptance/catalog-browsing/e2e/browse.spec.ts | not run |

E2E-RESULT: chromium 0 passed, 0 failed, 0 skipped
