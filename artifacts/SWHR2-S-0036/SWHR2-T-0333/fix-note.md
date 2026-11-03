# Fix note — SWHR2-T-0333

**Root cause:** `PetMap` forced the img to panel-width × 300 px; the SVG's default `meet` aspect ratio letterboxed the 1000×300 art, leaving gutters above 1000 px so picture cells no longer matched the five equal name cells. Its `<map>/<area>` used fixed 0–1000 px coords that never rescale, so clicks hit the wrong pet at any other width.

**Fix:** img is `block h-auto w-full` (keeps proportions, spans panel); `<map>` replaced by five absolutely positioned `Link`s (20 % wide, full height, named by pet). Names row, alt text and `splash.svg` unchanged.

**Files:** `src/components/storefront/PetMap.tsx`, `src/components/storefront/PetMap.test.tsx`, `e2e/pet-map.spec.ts` (alignment ≤2 px, no gutter, click-through at 700 and 1800 px viewports).

CODE-REVIEW: self-review — diff is ~25 lines in one component; no findings.
