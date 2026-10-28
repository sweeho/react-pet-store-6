# Design check: SWHR2-T-0093

Mockups named by PLAN.md: SWHR2-MCK-7 `mockup-screen-definition-not-found.html` (any storefront route whose screen resolves nowhere, 1440 px).

## SWHR2-MCK-7 Screen definition not found

No screenshot pair was taken, and this is a gap, not a pass:

- The mockup file is not in the worktree (`artifacts/SWHR2-S-0007/design/` holds only `MANIFEST.md`), and the design export call reported a write that left no file on disk.
- No route renders the not-found state yet. `useScreen` (src/locales/useScreen.tsx) returns the shared `ErrorFrame` with the message "Definition for screen <name> not found", but storefront pages adopt it in SWHR2-T-0095, so there is no built screen at a route to capture.

Difference left: the title "Screen not available" is my wording and is not checked against the mockup copy. SWHR2-T-0095, which wires pages to `useScreen`, should do the side-by-side render.
