import { expect, test } from "@playwright/test";

const AREA_ROUTES = ["/petstore", "/petstore/cart", "/petstore/signin", "/admin", "/supplier"];

test.describe("Landing page", () => {
  test("shows the welcome heading and a link to every primary area", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to Pet Store");
    for (const route of AREA_ROUTES) {
      await expect(page.getByRole("main").locator(`a[href="${route}"]`)).toHaveCount(1);
    }
  });

  test("has no vertical scrollbar on common viewport sizes", async ({ page }) => {
    for (const size of [
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(size);
      await page.goto("/");

      const { scrollHeight, clientHeight } = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
    }
  });
});
