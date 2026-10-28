# SWHR2-T-0093 — Localization 1: Locale model and resolution

Change `swhr2-i-0003-localization`. Read `design.md` first (Target design → Components; Sprint SWHR2-S-0007 planning).
Requirements: Locale code interpretation (SWHR2-R-0077), Page locale resolution and fallback (SWHR2-R-0133); tasks 1.1–1.4.

## Objective

One locale model for both sides, and the per-locale screen registry with its resolver and fallback.

## Steps

1. Add `shared` to the `include` of `tsconfig.json` and `tsconfig.node.json`; add `services` to `tsconfig.node.json` (design.md, Stack choices).
2. `shared/i18n/locale.ts`: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE` (en_US), `parseLocale(code)` returning `{ language, country, code }` or `null` (design.md, Components → Locale codes; tasks 1.1, 1.2).
3. `src/locales/registry.ts` exporting `registry` (`registry[locale][screen] = definition`, also the default export), and one definition module per supported locale for each storefront screen: `petstore-home`, `petstore-cart`, `petstore-signin`, `change-language`, `change-language-success`, plus the header strings (design.md, Components → Screen definitions).
4. `src/locales/resolveScreen.ts`: `resolveScreen({ screen, requestLocale?, sessionLocale })` → `{ locale, definition }`; throws `Error("Definition for screen <name> not found")` when no locale has it (design.md, Components → Screen locale resolver; tasks 1.3, 1.4). Add a small React helper in the same directory (e.g. `useScreen`) that pages use; it renders `ErrorFrame` with that message when resolution throws (mockup SWHR2-MCK-7).
5. `services/locale.ts`: `requestLocale(event)` = valid `locale` query parameter, else `event.context.session?.locale`, else `DEFAULT_LOCALE` (design.md, Components → Server locale helper).

## File/module ownership

Create: `shared/i18n/locale.ts`, `src/locales/**` (registry, resolveScreen, helper, `<locale>/` definitions), `services/locale.ts`. Modify: `tsconfig.json`, `tsconfig.node.json`. Tests belong to SWHR2-T-0098.

## Design reference

`artifacts/SWHR2-S-0007/design/mockup-screen-definition-not-found.html` (SWHR2-MCK-7) — any storefront route whose screen resolves in no locale, 1440 px viewport. See `artifacts/SWHR2-S-0007/design/MANIFEST.md`.

## Definition of Done

AC-1 to AC-7 on the ticket. The acceptance cases SWHR2-C-0023/0024/0025 (`tests/acceptance/localization/i18n.test.ts`) and SWHR2-C-0035/0036/0037/0038 (`screens.test.tsx`) pass. The app builds and type-checks on a clean checkout.
