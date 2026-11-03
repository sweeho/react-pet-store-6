## Context

Defect SWHR2-T-0333. `src/components/storefront/PetMap.tsx` renders the home page's pet picture and is used only by `src/pages/petstore/index.tsx`. The storefront layout (`src/pages/petstore.tsx`) gives the centre column `flex-1`, so the picture's panel width is fluid and often exceeds 1000 px on desktop.

## Root cause

Verified in code; the brief's hypothesis holds.

- **The picture.** It is `<img src="/images/splash.svg" width=1000 height=300 className="h-[300px] w-full object-fill">`. `public/images/splash.svg` has `viewBox="0 0 1000 300"`, no `preserveAspectRatio`, and its cell dividers at x = 200/400/600/800.
  - The img box is forced to panel-width × 300 px, but the SVG's default `preserveAspectRatio="xMidYMid meet"` still applies inside it.
  - So the artwork is scaled to fit the 300 px height and centred.
  - Below 1000 px the art fits the width and the cells line up.
  - Above 1000 px it stays 1000 px wide with equal gutters. At a 1400 px panel the picture cells are 200 px while the names below are 280 px.
- **The names row.** It is `grid grid-cols-5`, five equal cells across the full panel width.
- **The click regions.** They are `<map>`/`<area shape="rect">` with fixed coordinates 0–1000 × 0–300 (`regionWidth = WIDTH / 5`). HTML image maps are never rescaled to the rendered image, so at any width other than 1000 px a click lands on a neighbouring pet's region, or past x = 1000 on none. This part fails at narrow widths too, not only wide ones.
- **Tests.** No locked acceptance test or e2e spec asserts the image map. Only `src/components/storefront/PetMap.test.tsx` asserts `usemap="#petmap"` and the per-pet link hrefs.

## Decisions

- **D1 Keep the picture's proportions** (brief option A). The img becomes full-width with automatic height (`block h-auto w-full`, dropping `h-[300px] object-fill`). The 1000 × 300 artwork then always spans the panel, and its five 20 % cells match the five equal name cells by construction.
  - Rejected: stretching the SVG (`preserveAspectRatio="none"`, option B) distorts the pet drawings.
  - Rejected: rebuilding the picture as five grid cells (option C) is a larger change to the artwork for the same outcome.
- **D2 Replace the image map with overlay links.**
  - Wrap the img in a `relative` container and render one link per pet, absolutely positioned over its 20 % column at full picture height, using router `Link` to `/petstore/category/<ID>`.
  - Each link keeps the pet's name as its accessible name and stays in the tab order, as the `<area>` elements were.
  - Remove `<map>`, `useMap` and the fixed `coords`.
- **D3 Keep the rest.**
  - The img keeps its alt text (`mapLabel` / "Pet selection map") and `width`/`height` attributes, so the box reserves its aspect ratio before load.
  - The names row is untouched.
  - `splash.svg` is untouched.
- **D4 Verify layout in a browser.** jsdom has no layout, so alignment and click targets are checked in a new Playwright spec `e2e/pet-map.spec.ts`. At viewports giving a picture panel narrower than 1000 px and wider than 1000 px (for example 1400 px), it asserts:
  - each overlay link's left and right edges are within 2 px of its name cell's
  - the img's width equals its panel's width (no gutter)
  - clicking the centre of a pet's picture cell opens that pet's category

  `PetMap.test.tsx` drops the `usemap` assertion and keeps the per-pet href assertion, which the overlay and name links both satisfy.

## Verification

- The new e2e spec passes at both widths, and `PetMap.test.tsx` passes.
- The existing home, catalog-browsing and site-shell suites stay green.
