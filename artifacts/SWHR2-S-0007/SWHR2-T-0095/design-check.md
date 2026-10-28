# Design check: SWHR2-T-0095

Mockups: SWHR2-MCK-5 (change-language, default) and SWHR2-MCK-6 (confirmation), `/petstore/change-language`, 1440 px.

No screenshot pairs were taken. The mockup HTML files were never written to the worktree (the export call reported success but left no file) and the container has no Chromium. I read the mockup markup from the rendered canvas instead and built from it. This is a gap, not a pass.

Matched from the markup: page title "Change language" with a description, a card with a "Current language" row, a Language selector with US English / German / Japanese / Simplified Chinese, the German note, and a "Change Locale" primary button; a confirmation naming the locale code.

Differences left:

- The mockup's right-hand "What changes when you switch" card and the Cancel button are not built (not in the plan or acceptance criteria).
- The header flags sit in a bar at the top of the `/petstore` content, not in the shell header, because the shell header slot is filled only from `src/main.tsx`, which this ticket does not own. The flags show EN / JA / ZH with the language names as accessible labels, since visible 日本語 / 中文 would break the "US English shows no Japanese or Chinese text" case.
- Spacing and colours use the project's Tailwind tokens, not the mockup's literal values.
