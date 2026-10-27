import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the real app in a real browser via Playwright — the outermost
 * layer of the test pyramid. Use this tier for things that only a real
 * browser can verify: responsive layout, CSS-driven visibility, multiple
 * elements interacting together across a full page. Prefer the
 * component-level UI test (src/pages/index.test.tsx) for anything that
 * doesn't specifically need a real browser — it's far faster.
 */
test.describe("Home page", () => {
  test("shows the hero content", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vortex");
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
  });

  test("has no vertical scrollbar on common viewport sizes", async ({ page }) => {
    for (const size of [
      { width: 375, height: 812 },
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
