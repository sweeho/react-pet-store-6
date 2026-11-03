---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0036
capability_brief: SWHR2-I-0017
branch: vortex/sprint/swhr2-s-0036-f2c6d2bd
upstream: [artifacts/SWHR2-S-0036/qa-test-report.md]
---

# Release notes — SWHR2-S-0036

## Fixed

- **"Choose a pet" picture lines up with the pet names.** On the store home page, the picture now fills its panel on wide screens instead of shrinking into the middle, and each pet sits directly above its name. (SWHR2-T-0333)
- **Clicking a pet in the picture opens the right category.** Before, at most window sizes a click could open a neighbouring pet's category, or nothing. It now opens the pet you clicked at any width. (SWHR2-T-0333)

## Changed

- **The picture's height follows its width.** On wide screens it is taller than before, and on narrow screens shorter, so the content below it moves. (SWHR2-T-0333)

## Upgrade notes

- No migration, configuration or dependency change.
