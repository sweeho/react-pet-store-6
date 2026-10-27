import { expect, test } from "@playwright/test";

const AREA_HREFS = [
  "/petstore",
  "/petstore/cart",
  "/petstore/checkout",
  "/petstore/change-language",
  "/petstore/signin",
  "/petstore/account",
  "/admin",
  "/admin/tool",
  "/supplier",
];

/**
 * UI / E2E TEST
 *
 * Drives the real app in a real browser via Playwright. Prefer the
 * component-level UI test (src/pages/index.test.tsx) for anything that
 * doesn't specifically need a real browser.
 */
test.describe("Landing page", () => {
  test("[SWHR2-C-0270] root URL shows the landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.getByText(/not found|404/i)).toHaveCount(0);
  });

  test("[SWHR2-C-0272] each landing page link opens its area", async ({ page }) => {
    for (const href of AREA_HREFS) {
      await page.goto("/");
      await page.getByRole("main").locator(`a[href="${href}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${href}/?$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText(/not found|404/i)).toHaveCount(0);
    }
  });
});
