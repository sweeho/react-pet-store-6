# TDD result — SWHR2-T-0276 Shopping cart

## Test cases

Linked cases C-0080 to C-0088, C-0091 to C-0100, cited in colocated tests:
`services/cart.test.ts`, `services/errors.test.ts`, `routes/api/cart/cart.test.ts`,
`src/errors/routeFailure.test.ts`, `src/pages/petstore/cart.test.tsx`,
`src/pages/petstore/error/pages.test.tsx`, `src/components/storefront/AddToCart.test.tsx`.

## Red run

Platform run `f280639b-b94b-4d28-91f4-81707f02442c` at 7fca868: valid. Failures were stub or assertion failures.
Already passing: C-0084, C-0085, C-0095 (the session already discards carts).

## Green run

Platform run `a42da2a7-7083-4aa5-8f94-142b82c78cb6` at c712935: valid, all 19 linked cases pass.

## Notes

`routes/api/cart/cart.test.ts`, `src/pages/petstore/cart.test.tsx` and `src/pages/petstore/item/[itemId].test.tsx`
changed after red, flagged by the platform: the route test was made self-contained (the tsc project cannot import
the locked acceptance harness), the cart page test now answers fetches by URL (LocaleProvider also fetches
`/api/session`), and the item test asserts navigation to the cart (P5) instead of the inline status.
No assertion was weakened.
