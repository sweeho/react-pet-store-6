---
artifact: integration-defects-resolution
sprint: SWHR2-S-0007
ticket: SWHR2-T-0103
author: validation
---

# Integration defects resolution — SWHR2-S-0007

## D1: localization E2E specs race the session-locale fetch

- Scenario: Supported storefront locales and header language switch / Shopper switches to Japanese from the header (test-side defect; the behaviour itself holds).
- Symptom: `e2e/localization.spec.ts` read `innerText()` immediately after `page.goto`; `LocaleProvider` applies the session locale after an async fetch, so the page was still English. Failed 2/10 then 1/10 on identical code.
- Round 1: replaced the three immediate `innerText()` assertions with auto-retrying `expect(body).toContainText(...)`. Re-ran full E2E 3 times: 10 passed each. Lint and typecheck exit 0.
- Status: FIXED-IN-PLACE.

| Defect | Status | Rounds | Ticket |
| ------ | ------ | ------ | ------ |
| D1     | fixed  | 1      | n/a    |

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
