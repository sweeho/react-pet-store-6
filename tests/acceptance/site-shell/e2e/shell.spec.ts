import { expect, test } from "@playwright/test";

// Routes of the primary areas the landing page links to (design.md).
const AREAS = ["/petstore", "/petstore/cart", "/petstore/signin", "/admin", "/supplier"];
const PAGES = ["/", ...AREAS, "/does-not-exist"];

test.describe("site shell", () => {
  // case: SWHR2-C-0270@v1
  test("SWHR2-C-0270: the root URL shows the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.getByText(/not found|404/i)).toHaveCount(0);
  });

  // case: SWHR2-C-0272@v1
  test("SWHR2-C-0272: each landing page link opens its area", async ({ page }) => {
    for (const area of AREAS) {
      await page.goto("/");
      await page.getByRole("main").locator(`a[href="${area}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${area}/?$`));
      await expect(page.getByText(/not found|404/i)).toHaveCount(0);
      await expect(page.getByRole("main")).toBeVisible();
    }
  });

  // case: SWHR2-C-0273@v1
  test("SWHR2-C-0273: global navigation appears on every page", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.getByRole("navigation").first(), path).toBeVisible();
    }
  });

  // case: SWHR2-C-0274@v1
  test("SWHR2-C-0274: the navigation link returns to the landing page", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("navigation").first().locator('a[href="/"]').first().click();
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  // case: SWHR2-C-0276@v1
  test("SWHR2-C-0276: every route uses the shared layout", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      for (const role of ["banner", "navigation", "main", "contentinfo"] as const) {
        await expect(page.getByRole(role).first(), `${path} ${role}`).toBeVisible();
      }
    }
  });
});
