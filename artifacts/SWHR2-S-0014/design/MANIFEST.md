# Design manifest — SWHR2-S-0014

Capability brief **SWHR2-I-0005** (Sign-on and access control), canvas doc version **12** (frozen). These are the approved mockups only. The six wireframe blocks on the canvas are drafts, not designs to build.

| Mockup       | Title                                       | Route and state                                                                 | Viewport | Block id                               |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------------------- | -------- | -------------------------------------- |
| SWHR2-MCK-13 | Storefront sign-in                          | `/petstore/signin`, visitor, empty forms                                        | 1440     | `481bdf12-c114-43bb-bb92-1b28b6340ab0` |
| SWHR2-MCK-14 | Storefront header — signed out vs signed on | any storefront page (`/petstore`), visitor and signed-on `j2ee`                 | 1440     | `d3eeadbd-c43a-4498-803b-9bdaa5ee1847` |
| SWHR2-MCK-15 | Signed out                                  | `/petstore/signed-out`, after Sign out                                          | 1440     | `c60c3bcd-78a7-4861-8dc3-eabda18ac208` |
| SWHR2-MCK-16 | Administration sign-in and Login Error      | `/admin`, not signed in; then after a rejected sign-in                          | 1440     | `0d1f9230-4509-426a-8895-dd498cb03475` |
| SWHR2-MCK-17 | Administration landing page                 | `/admin`, signed in as administrator                                            | 1440     | `bfb9169d-be2a-45b7-adad-f99bc5524e14` |
| SWHR2-MCK-18 | Supplier sign-in                            | `/supplier`, not signed in (and the "sign out of administration first" refusal) | 1440     | `20000441-ea18-463d-8cb8-e6575f600694` |

## Getting the HTML

The planning export (`a2a_get_capability_brief_design` with `write_to`) wrote these files to the platform's workspace, not to the sprint branch, so they are not committed here. Fetch a mockup with `a2a_get_capability_brief_design(capability_brief_key="SWHR2-I-0005", block_id=<block id>, write_to="artifacts/SWHR2-S-0014/design/mockup-<slug>.html")`, where `<slug>` is one of `storefront-sign-in`, `storefront-header-signed-out-vs-signed-o`, `signed-out`, `administration-sign-in-and-login-error`, `administration-landing-page`, `supplier-sign-in`.
