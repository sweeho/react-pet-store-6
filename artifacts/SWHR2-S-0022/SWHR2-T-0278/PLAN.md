---
artifact: plan
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0022
ticket: SWHR2-T-0278
branch: vortex/test/SWHR2-T-0278-qa-rework-round-1-4-case-s-red-in-the-of-52b186eb
---

# Plan — SWHR2-T-0278 QA rework round 1

Cases are already locked in `tests/acceptance/`; no test is edited.

1. SWHR2-C-0280/0281/0282: catalog data access must also read `CATALOG_DAO_CLASS` and `CATALOG_DAO_DATABASE`, accept a double without a `dialect`, and expose `registerDialect(name, sqliteClient)` so the configured dialect selects the store connection.
2. SWHR2-C-0022: the cart screen reads its text right after navigation; load the cart in the route chunk (awaited, so the load event waits) and render from the reply's locale.
