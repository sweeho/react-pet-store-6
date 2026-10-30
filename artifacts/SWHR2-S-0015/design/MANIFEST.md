# Design manifest — SWHR2-S-0015

Capability brief **SWHR2-I-0006** (Customer account and profile), canvas doc version **12** (frozen). This lists the approved mockups only. The three wireframe blocks on the canvas are drafts, not designs to build.

| Mockup       | Title                                           | Route and state                                                                                        | Viewport | Block id                               | File                                                   |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------- | -------------------------------------- | ------------------------------------------------------ |
| SWHR2-MCK-19 | Account information                             | `/petstore/account`, signed on straight after sign-up (empty form); edit mode for an existing customer | 1440     | `3d1e550b-99b0-427d-877e-9df0733d4304` | `mockup-account-information.html`                      |
| SWHR2-MCK-20 | User Creation Error                             | `/petstore/user-creation-error`, after sign-up with a user name in use                                 | 1440     | `7b397af2-ef89-45c2-bd33-26c70bf673c8` | `mockup-user-creation-error.html`                      |
| SWHR2-MCK-21 | Home screen — My List panel and pet-tips banner | `/` (and `/petstore`), signed on as `j2ee` with MyList and banner on                                   | 1440     | `255b4f4f-97b2-4bef-80a3-3b5cbd79108a` | `mockup-home-screen-my-list-panel-and-pet-tips-b.html` |

## Getting the HTML

The planning export (`a2a_get_capability_brief_design` with `write_to`) reported success, but it wrote to the platform's workspace and not to this container, so the files are not committed here. The same happened in SWHR2-S-0014.

To get a mockup, call `a2a_get_capability_brief_design(capability_brief_key="SWHR2-I-0006", block_id=<block id>, write_to="artifacts/SWHR2-S-0015/design/<file>")` using the file names above. If the file still does not appear in your worktree, render the canvas instead.
