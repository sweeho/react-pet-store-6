# Design check

Not performed with screenshots. `artifacts/SWHR2-S-0004/design/` and `PLAN.md` were absent from the branch (the export tool reported writing the mockup but nothing reached the worktree), and the container has no Chromium. I read the mockup HTML via the canvas render (`mockup-landing-page.html`, 1440x900) and built the page from it by hand.

Known differences: Tailwind palette (indigo-600, slate) stands in for the mockup's literal hex values; header search and language switcher are static visuals; category tiles use one paw icon for all; area routes beyond `/` do not exist yet.
