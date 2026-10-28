---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0001
ticket: SWHR2-T-0004
branch: vortex/sprint/swhr2-s-0001-67b3b433
upstream: [openspec/changes/swhr2-i-0002-bootstrap-landing-page-and/design.md]
downstream:
  [
    artifacts/SWHR2-S-0001/SWHR2-T-0004/tdd-test-result.md,
    artifacts/SWHR2-S-0001/SWHR2-T-0004/summary.md,
  ]
---

# Plan — SWHR2-T-0004: Boilerplate — brand the scaffold as Pet Store and keep the root smoke test green

Change `swhr2-i-0002-bootstrap-landing-page-and` · tasks 1.1, 1.2 · read `design.md` (including §Planning findings) FIRST.

## Objective

The existing scaffold is extended, not replaced (design.md §Decisions "Existing boilerplate wins"). After this ticket the app identifies as Pet Store, the design-guide colours and Inter type are available as Tailwind utilities, and the root smoke spec proves the app boots. No page content changes here; the landing page is SWHR2-T-0005.

## Steps

1. Set `<title>Pet Store</title>` in `index.html`.
2. In `configs/fonts.config.ts`, replace Space Grotesk with Inter (weights 400, 500, 600, 700). The mockups set `--sans: Inter, system-ui, sans-serif`.
3. In `src/index.css`, add the design-guide tokens in `:root`: `--brand: #4f46e5`, `--brand-foreground: #ffffff`, `--surface: #f8fafc` and `--danger: #dc2626`. Map them in `@theme inline` as `--color-brand`, `--color-brand-foreground`, `--color-surface` and `--color-danger`. Set `--font-sans: Inter, system-ui, sans-serif` there too. Point the existing `--foreground` (#0f172a), `--muted-foreground` (#64748b), `--border`/`--input` (#e2e8f0) and `--ring` (brand) at the guide's values, so existing utility names keep working. Leave `.dark` alone, except to give the new tokens sensible dark values so no class resolves to nothing.
4. Fix the known light-mode `--destructive-foreground` duplicate (it equals `--destructive`, so text is invisible) by setting it to white. The shared error frame (SWHR2-T-0007) depends on it.
5. Keep `e2e/smoke.spec.ts` as the root-route smoke test: 2xx response, a visible level-1 heading and zero console errors, plus its API and DB route checks. Update only its header comment if needed. It must keep passing against the current home page; SWHR2-T-0005 changes the page, not this spec.
6. Check every page still renders: no class referenced anywhere resolves to an undefined token.

## File/module ownership

- `index.html`
- `configs/fonts.config.ts`
- `src/index.css`
- `e2e/smoke.spec.ts`

Not this ticket: any `src/pages/**`, `src/components/**`, `.github/workflows/ci.yml`, `tests/acceptance/**` (protected; never edit).

## Design reference

Files: `artifacts/SWHR2-S-0001/design/mockup-site-shell.html` (token values in its `:root`), `artifacts/SWHR2-S-0001/design/MANIFEST.md`.
Canvas: SWHR2-I-0002 · doc v12
Agent fetch: `curl -H "Authorization: Bearer $VORTEX_A2A_RUN_TOKEN" "$VORTEX_CANVAS_BASE_URL/canvas/415b4a3a-f05d-40ec-8eff-a5f9a7c42b09/render.html"`

What this ticket must match: the colour and font tokens only. Out of scope: any layout or component.

## Definition of Done

AC-1, AC-2, AC-3, AC-4 of SWHR2-T-0004.
