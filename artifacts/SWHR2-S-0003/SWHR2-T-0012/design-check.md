# Design check SWHR2-T-0012

No side-by-side screenshots were taken. The mockup HTML was not on the branch (`artifacts/SWHR2-S-0003/design/` missing) and the MCP export did not write the files into the worktree, so the comparison could not be run.

Mockups for this ticket, none compared:

- mockup-empty-state (EmptyFrame, used by /users empty and NotFound)
- mockup-error-state (ErrorFrame with Retry)
- mockup-site-shell, mockup-landing-page (not changed by this ticket)

Left difference: the frames follow the design-system tokens (border, card, destructive, muted-foreground) with a centred card layout, not verified against the mockups' spacing or copy.
