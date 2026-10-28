# Design check — SWHR2-T-0098

This ticket adds tests only; it builds no screen. No side-by-side screenshots were taken:
the container has no Chromium (`bun run test:e2e` preflight fails), so Playwright cannot render either side.

| Mockup                                                 | Route / state                        | Screenshots       | Difference left                                                                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR2-MCK-5 `mockup-change-language-screen.html`       | `/petstore/change-language`, 1440 px | none (no browser) | Not compared. `src/pages/petstore/change-language.test.tsx` and `e2e/localization.spec.ts` assert the four options (US English, German, Japanese, Simplified Chinese) and the "Change Locale" button. |
| SWHR2-MCK-6 `mockup-change-language-confirmation.html` | same route after submit, 1440 px     | none (no browser) | Not compared. Tests assert the confirmation text contains the new locale code (ja_JP, zh_CN).                                                                                                         |
| SWHR2-MCK-7 `mockup-screen-definition-not-found.html`  | unknown screen, 1440 px              | none (no browser) | Not compared. `src/locales/resolveScreen.test.ts` asserts the "Definition for screen unknown not found" error text.                                                                                   |

Layout, spacing, type and colour of the built screens are owned by SWHR2-T-0095/T-0096; Validation renders them at INTEGRATION_QA.
