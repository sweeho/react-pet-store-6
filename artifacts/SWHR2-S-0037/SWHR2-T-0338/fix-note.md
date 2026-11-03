# Fix note — SWHR2-T-0338

CODE-REVIEW: self-review — small diff, checked against design.md D4/D5; no findings.

## Root cause

`GlobalNav` (area labels, group headings, Home, nav landmark name) and the `AppShell` footer were hard-coded English literals, so every ja_JP/zh_CN page still contained "Sign in" and other English.

## Fix

New per-locale `shell` screen definitions (`src/locales/{en_US,ja_JP,zh_CN}/shell.ts`, registered in `registry.ts`), keyed by route for area labels. `GlobalNav` and the `AppShell` footer render through `useScreen("shell", locale)`. en_US values equal the old literals, so English tests are unchanged.

## Files

src/locales/{en_US,ja_JP,zh_CN}/shell.ts (new), src/locales/registry.ts, src/components/shell/GlobalNav.tsx, AppShell.tsx, plus tests: GlobalNav.test.tsx, AppShell.test.tsx, src/pages/petstore/locale.test.tsx (additions only).
