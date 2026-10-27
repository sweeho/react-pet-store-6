# Design check — SWHR2-T-0009

Playwright's Chromium is not installed in this container, so no side-by-side screenshots were taken. This ticket builds no screen; it only sets colour tokens and fonts that the mockups use.

| Mockup                               | Checked                                                | Differences left                                 |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------ |
| SWHR2-MCK-1 mockup-landing-page.html | Palette and fonts are those in the ticket AC           | No screenshots; page is built by a later ticket  |
| SWHR2-MCK-2 mockup-site-shell.html   | Token values from this mockup applied to src/index.css | No screenshots; shell is built by a later ticket |
| SWHR2-MCK-3 mockup-empty-state.html  | Shares the same tokens                                 | No screenshots; frame built later                |
| SWHR2-MCK-4 mockup-error-state.html  | Shares the same tokens; danger #dc2626 applied         | No screenshots; frame built later                |
