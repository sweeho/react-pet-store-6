import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("[SWHR2-C-0270] shows the landing page with the shell and a link to every primary area", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to Pet Store");
    const nav = page.getByRole("navigation", { name: "Global" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();

    for (const area of [
      "Catalog & search",
      "Shopping cart",
      "Checkout",
      "Sign in",
      "Account & profile",
      "Language",
      "Order approval",
      "Sales reporting",
      "Supplier inventory",
    ]) {
      await expect(page.getByRole("main").getByRole("link", { name: area })).toBeVisible();
    }
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
});
