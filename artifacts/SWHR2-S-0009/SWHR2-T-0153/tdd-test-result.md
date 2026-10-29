---
ticket: SWHR2-T-0153
---

## Notes

Platform-recorded runs. Red: run 51e3a60a-0aec-4154-ba4d-e13683fc15d1 (C-0191 failed on assertion; C-0192, C-0204, C-0205 already passed because the existing schema already refused them). Green: run e228194f-6b33-4ca7-bc79-63ce469b0a38 (all four cases pass).

Tests: `services/catalog-schema.test.ts` (new), plus fixtures moved to hundredths in `services/catalog.test.ts`, `services/cart.test.ts`, `routes/api/catalog/items/[itemId].get.test.ts`.
