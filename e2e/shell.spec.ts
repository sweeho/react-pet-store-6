import { expect, test } from "@playwright/test";

import { NAV_AREAS } from "../src/constants/navigation";

const routes = ["/", "/about", ...NAV_AREAS.map((a) => a.href), "/does-not-exist"];

async function expectShell(page: import("@playwright/test").Page) {
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Global" })).toBeVisible();
}

test.describe("Site shell", () => {
  for (const route of routes) {
    test(`[SWHR2-C-0273] [SWHR2-C-0276] ${route} shows the shared layout and global navigation`, async ({
      page,
    }) => {
      await page.goto(route);
      await expectShell(page);
    });
  }

  test("[SWHR2-C-0274] the navigation link returns to the landing page", async ({ page }) => {
    await page.goto("/about");
    await page
      .getByRole("navigation", { name: "Global" })
      .getByRole("link", { name: "Home", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
