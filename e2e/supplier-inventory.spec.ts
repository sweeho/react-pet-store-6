import { expect, test } from "@playwright/test";

const SUPPLIER = {
  user: process.env.E2E_SUPPLIER_USER ?? "supplier",
  pw: process.env.E2E_SUPPLIER_PASSWORD ?? "supplier-pw",
};

test("supplier updates only the marked row", async ({ page }) => {
  await page.goto("/supplier");
  await page.getByLabel("User ID").fill(SUPPLIER.user);
  await page.getByLabel("Password").fill(SUPPLIER.pw);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Display Inventory" }).click();
  await expect(page).toHaveURL(/\/supplier\/inventory$/);

  await page.getByLabel("New quantity for EST-4").fill("77");
  await page.getByLabel("Mark EST-4 for update").check();
  await page.getByLabel("New quantity for EST-5").fill("88");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Inventory updated")).toBeVisible();

  await page.getByRole("button", { name: "Display Inventory" }).click();
  await expect(page.getByRole("row").filter({ hasText: "EST-4" }).getByText(/^77$/)).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "EST-5" }).getByText(/^88$/)).toHaveCount(0);
});
