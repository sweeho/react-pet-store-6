# Design check — SWHR2-T-0084

Mockups `mockup-empty-state.html` (MCK-3), `mockup-error-state.html` (MCK-4), `mockup-site-shell.html` (MCK-2, loading).

Screenshots: none. Playwright Chromium is not installed in this container, so no side-by-side render was possible. Frames were built from the mockup markup and CSS by reading: round 48px icon badge, 16px semibold heading, muted message, primary and secondary buttons in a row.

Differences left, with reasons:

- Frame height is `min-h-[320px]` rather than the mockups' fixed 440/420px, so it fits any content well.
- The empty icon is a generic inbox, since the mockup's cart icon is cart-specific; the cart passes its own copy via `message`.
- The error mockup's "Couldn’t load" pill is omitted; it is not in the interface contract.
- Colours use design-system tokens (`bg-muted`, `text-muted-foreground`) and `text-red-600` for the danger icon.
