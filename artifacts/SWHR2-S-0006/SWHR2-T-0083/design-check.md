# Design check — SWHR2-T-0083

Mockup: `mockup-site-shell.html` (SWHR2-MCK-2), `/about`, 1440px.

Screenshots were NOT captured: the container has no Playwright Chromium (`bun run test:acceptance:e2e` refused to start). The comparison below is from reading the mockup markup against the built components.

Matches: 240px rail / 56px header / 40px footer grid; brand mark linking to `/`; "Global" navigation with group headings; active item in brand colour; footer with Pet Store and Home link; rail collapses behind a menu button below `lg`.

Differences left:

- Group headings follow the ticket (Shop / Account / Administration / Supplier), not the mockup's Shop / You / Store staff (design.md D3).
- Mockup's header search, language switcher, cart and sign-in controls, catalog sub-list and lock icons are not built; they belong to later capabilities via the `header` slot.
- Home is a separate top item above the groups, not inside Shop.
- Colours and radii use the design-system tokens (`primary`, `muted`, `border`) rather than the mockup's literal values.
