import { expect, test } from "@playwright/test";

// Mirrors the hrefs in src/constants/navigation.ts (NAV_AREAS).
const NAV_AREA_ROUTES = [
  "/petstore",
  "/petstore/cart",
  "/petstore/checkout",
  "/petstore/signin",
  "/petstore/account",
  "/petstore/language",
  "/admin/orders",
  "/admin/sales",
  "/supplier",
];

const routes = ["/", "/about", ...NAV_AREA_ROUTES, "/does-not-exist"];

async function expectShell(page: import("@playwright/test").Page) {
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Global" })).toBeVisible();
}

test.describe("Site shell", () => {
  for (const route of routes) {
    test(`${route} shows the shared layout and global navigation`, async ({ page }) => {
      await page.goto(route);
      await expectShell(page);
    });
  }

  test("the navigation link returns to the landing page", async ({ page }) => {
    await page.goto("/about");
    await page
      .getByRole("navigation", { name: "Global" })
      .getByRole("link", { name: "Home", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
