# Summary — SWHR2-T-0234

CODE-REVIEW: n/a — no code changed.

## What changed

Only `artifacts/SWHR2-S-0014/integration-defects-resolution.md` (round 1 entry) and this ticket's artifacts. C-0256, C-0258 and C-0269 each fail because of a fault in the locked test; each was disputed through `a2a_dispute_test_case`.

## AC coverage

Not met: the three cases remain red until the approver edits or retires them.

## Verification

Browser checks from the QA run (`PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bunx playwright test --config playwright.acceptance.config.ts tests/acceptance/sign-on`): app behaviour for C-0256 and C-0269 verified correct by direct probes; C-0258 fails on a 3-link strict-mode match.
