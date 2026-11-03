# PLAN — SWHR2-T-0338 UAT: SWHR2-C-0026 (fully localized screens)

Change: `swhr2-s-0037-bugfix-swhr2-t-0337-swhr2-t`. Read its `design.md` FIRST (R3, Decisions D4, D5, D6). This fix depends on SWHR2-T-0337, and therefore SWHR2-T-0339, being merged.

## Objective

The global navigation and footer show in the session locale, so ja_JP and zh_CN storefront screens carry no English chrome. The US English text is unchanged.

## Steps

Work `tasks.md` §3 in order. Tick nothing yourself.

1. Add `src/locales/{en_US,ja_JP,zh_CN}/shell.ts` and register them in `src/locales/registry.ts` (D4). The en_US values must equal today's literals exactly.
2. Render `GlobalNav` (area labels by route, group headings, "Home") and the `AppShell` footer through `useScreen("shell", locale)` (D4, D5). `areas.ts` stays the en_US source and route list.
3. Unit tests for ja_JP and zh_CN navigation. Existing `GlobalNav.test.tsx`, `AppShell.test.tsx` and site-shell expectations stay as they are. Do not edit `tests/acceptance/**`.
4. Confirm on the merged branch that locked C-0021, C-0026, C-0027 and C-0028 pass.

## File/module ownership

- Modify: `src/components/shell/GlobalNav.tsx`, `src/components/shell/AppShell.tsx`, `src/locales/registry.ts`, `src/components/shell/GlobalNav.test.tsx` (additions only).
- Create: `src/locales/en_US/shell.ts`, `src/locales/ja_JP/shell.ts`, `src/locales/zh_CN/shell.ts`.

## Definition of Done

AC-1 and AC-2 on the ticket. Locked case SWHR2-C-0026 passes, and the site-shell suites stay green.
