# Fix note — SWHR2-T-0337

CODE-REVIEW: self-review — small diff, checked against design.md D2/D3; no findings.

## Root cause

`StorefrontHeader` kept its own session copy of the locale, refreshed only on pathname change, so a flag click never relabelled it. `LanguageFlags` rendered in the `/petstore` layout body, not the page header.

## Fix

`StorefrontHeader` reads the locale from `useLocale()` (root provider from SWHR2-T-0339); its session fetch now serves sign-on state only. `LanguageFlags` renders inside the header on non-staff paths and is removed from `src/pages/petstore.tsx`.

## Files

src/components/storefront/StorefrontHeader.tsx (+test), LanguageFlags.tsx (spacing class only), src/pages/petstore.tsx, src/pages/petstore/locale.test.tsx (renders the header, where the flags now live).
