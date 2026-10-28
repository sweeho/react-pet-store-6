import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("[SWHR2-C-0270] the root route shows the landing page and links to every primary area", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to Pet Store");
    expect(new URL(page.url()).pathname).toBe("/");
    for (const href of ["/petstore", "/petstore/cart", "/petstore/signin", "/admin", "/supplier"]) {
      await expect(page.getByRole("main").locator(`a[href="${href}"]`)).toHaveCount(1);
    }
    await expect(page.getByRole("navigation", { name: "Global" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
});
