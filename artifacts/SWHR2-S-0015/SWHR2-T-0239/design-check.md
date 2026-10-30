# Design check — SWHR2-T-0239

Each mockup was rendered with Playwright next to the built screen at 1440 wide. Screenshots are in `design-check/`.

| Mockup       | Route / state                                    | Mockup                           | Built                           |
| ------------ | ------------------------------------------------ | -------------------------------- | ------------------------------- |
| SWHR2-MCK-19 | `/petstore/account`, empty form after sign-up    | `design-check/mck-19-mockup.png` | `design-check/mck-19-built.png` |
| SWHR2-MCK-20 | `/petstore/user-creation-error`                  | `design-check/mck-20-mockup.png` | `design-check/mck-20-built.png` |
| SWHR2-MCK-21 | `/`, j2ee, MyList and banner on, favourite BIRDS | `design-check/mck-21-mockup.png` | `design-check/mck-21-built.png` |

## Differences left

- Sample data: the mockups use placeholder product names and prices in the My List panel; the built screen shows the seeded BIRDS products.
- Labels: where a mockup label differs from the label rules in design.md "Interface contracts", the rule wins because the locked acceptance tests depend on it.
- Colour and spacing use the design-system tokens, not the mockups' literal values.
- The e2e browser is not installed in this container, so the built screenshots come from the earlier render pass; the final gate was `bun run verify`.
