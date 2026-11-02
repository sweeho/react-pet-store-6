# Design check — SWHR2-T-0299

Viewport 1440×900, supplier signed in. Screenshots in `design-check/`.

| Mockup       | Route / state                                                       | Mockup                              | Built                              |
| ------------ | ------------------------------------------------------------------- | ----------------------------------- | ---------------------------------- |
| SWHR2-MCK-32 | `/supplier`, signed in                                              | `design-check/home-mockup.png`      | `design-check/home-built.png`      |
| SWHR2-MCK-33 | `/supplier/inventory`, EST-1 and EST-2 marked, EST-6 typed unmarked | `design-check/inventory-mockup.png` | `design-check/inventory-built.png` |

Differences left:

- Header, rail and footer are the existing shell, not the mockup's own (decided in PLAN).
- Row set is the 7 demo catalog items (EST-1, 2, 3, 4, 6, 7, 18) and their stock, not the mockup's 29 sample rows, so the "scroll for EST-16 to EST-29" note is replaced by "N items".
- Pills, buttons and the checkbox use the design-system tokens and native controls; the "Signed in" pill on the home is a plain line of text in a bordered box.
- The "Update" confirmation after Submit is in-page (SD6); the mockup does not draw it.
