## Test cases

e2e/localization.spec.ts: [SWHR2-C-0021], [SWHR2-C-0026], [SWHR2-C-0028], [SWHR2-C-0295], [SWHR2-C-0298], [SWHR2-C-0300]. Existing unit/integration tests cite C-0293, C-0294, C-0296, C-0297, C-0299.

## Red run

Behaviour already shipped; the tests pass at the test commit (regression guards). Platform red run recorded separately.

## Green run

`bunx playwright test e2e/localization.spec.ts`: 8 passed.

TDD-RESULT: 8 passed, 0 failed
