# Design check — SWHR2-T-0084

Screenshots: none for any mockup. Playwright Chromium is not installed in this container, so no side-by-side render was possible. The frames were built from each mockup's markup and CSS by reading.

## SWHR2-MCK-3 — mockup-empty-state.html (`/users`, empty list, 1440px)

Screenshots: not captured (no browser). Built: round 48px icon badge, 16px semibold heading, muted message, optional action slot.
Differences left:

- Height is `min-h-[320px]` instead of the fixed 440px, so it fits any page.
- Generic inbox icon, because the mockup's cart icon is cart-specific; the cart passes its own copy as `message`.

## SWHR2-MCK-4 — mockup-error-state.html (`/users`, API failing, 1440px)

Screenshots: not captured (no browser). Built: danger icon badge, heading, message, primary "Try again" and secondary "Back to home" buttons.
Differences left:

- The "Couldn’t load" pill is omitted; it is not in the interface contract.
- Height `min-h-[320px]` instead of 420px.
- Default copy is generic; the page passes its own title.

## SWHR2-MCK-2 — mockup-site-shell.html (loading content well, 1440px)

Screenshots: not captured (no browser). Built: centred spinner with a muted "Loading…" label, `role="status"`.
Differences left:

- Label is "Loading…" by default ("Loading users…" on `/users`) instead of the mockup's "Loading products…".

Colours use design-system tokens (`bg-muted`, `text-muted-foreground`); `text-red-600` for the danger icon.
