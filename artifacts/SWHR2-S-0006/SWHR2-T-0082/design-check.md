# Design check — SWHR2-T-0082

Mockups: `mockup-landing-page.html` (SWHR2-MCK-1, `/`) and `mockup-empty-state.html` (SWHR2-MCK-3, area placeholders), 1440px.

Screenshots were NOT captured: the container has no Playwright Chromium. The comparison is from reading the mockup markup against the built components.

Matches: h1 "Welcome to Pet Store" with intro line and a primary "Browse the catalog" button on the right; card grid below; placeholders use the shared `EmptyFrame`.

Differences left:

- The mockup's "Choose a pet" category panel (Birds, Fish, Dogs, ...) is omitted: it belongs to catalog-browsing (PLAN non-scope).
- The grid is headed "Everything in the store" and lists the primary areas, per the plan, instead of pet categories.
- The Catalog card is plain text; the CTA is the single `/petstore` link (SWHR2-C-0271 counts one link per route).
- Colours, radii and spacing use the design-system tokens, not the mockup's literal values.
