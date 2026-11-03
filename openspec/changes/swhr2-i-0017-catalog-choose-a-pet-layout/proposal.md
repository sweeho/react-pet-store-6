## Why

On the storefront home page (`/petstore`), the "Choose a pet" picture's five pet cells do not line up with the five name cells below it once the centre column is wider than 1000 px: the picture shrinks into the middle with blank space either side (defect SWHR2-T-0333, capability brief SWHR2-I-0017). The same cause makes the picture's click regions land on the wrong pet, or on nothing, at every width other than exactly 1000 px.

## What Changes

- The picture always spans the full width of its panel and keeps its proportions, so each pet's cell sits above its name cell at any width.
- The picture's selectable regions follow the picture's rendered size, so selecting a pet opens that pet's category at any width.
- Add regression scenarios to the catalog-browsing requirement "Home screen pet selection".
- The names row, its links and the "Pet selection map" alternative text are unchanged.

## Impact

- Affected capability: `catalog-browsing` (MODIFIED requirement "Home screen pet selection").
- Code: `src/components/storefront/PetMap.tsx` and its unit test, plus one new e2e spec. `public/images/splash.svg` is unchanged.
- The picture's height now follows its width (300 px at 1000 px wide), so content below it moves on wide and narrow screens.
- No route, API, data or dependency change.

## Follow-ups / out of scope

- None found.
