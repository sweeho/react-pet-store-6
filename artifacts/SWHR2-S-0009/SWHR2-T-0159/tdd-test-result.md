---
ticket: SWHR2-T-0159
---

## Notes

Platform-recorded runs. Red: fc088aca-a60b-47d7-a466-bf59933c3924 (C-0206 and C-0207 already passed: the behaviour was built by T-0153..T-0158). Green: recorded after the final commit (id in the ticket work comment).

The platform test command is Vitest only, so the cases are cited by `routes/api/catalog/browse-to-cart.test.ts`. The browser journey is in `e2e/catalog.spec.ts`, which could not be run here: this container has no Chromium (`bun run test:e2e` stops at the preflight).
