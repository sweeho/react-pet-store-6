# PLAN — SWHR2-T-0009

PLAN.md was absent from the branch (ticket description was a placeholder); self-authored from the ticket's acceptance criteria.

1. Add `src/design-tokens.test.ts` (token values, destructive-foreground, fonts). Red first.
2. `src/index.css`: light-mode tokens from the mockup palette under existing shadcn names; `--font-sans`/`--font-mono` in `@theme inline`.
3. `configs/fonts.config.ts`: Inter + JetBrains Mono.
4. Gate: `bun run verify`.
