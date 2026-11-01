import { expect, test, type Page } from "@playwright/test";

const SUPPLIER = {
  user: process.env.E2E_SUPPLIER_USER ?? "supplier",
  pw: process.env.E2E_SUPPLIER_PASSWORD ?? "supplier-pw",
};

/** Signs in as supplier and sets the given stock quantities through the inventory API. */
async function supplierWith(page: Page, stock: Record<string, number>) {
  await page.goto("/supplier");
  await page.getByLabel(/^user ?id:?$/i).fill(SUPPLIER.user);
  await page.getByLabel(/^password:?$/i).fill(SUPPLIER.pw);
  await page.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
  const res = await page.request.post("/api/supplier/inventory", {
    data: {
      rows: Object.entries(stock).map(([itemId, quantity]) => ({ itemId, quantity, marked: true })),
    },
  });
  expect(res.ok()).toBe(true);
  await page.goto("/supplier");
}
const display = (page: Page) =>
  page
    .getByRole("link", { name: /display inventory/i })
    .or(page.getByRole("button", { name: /display inventory/i }))
    .click();
const row = (page: Page, id: string) => page.getByRole("row").filter({ hasText: id });

test.describe("supplier inventory", () => {
  // case: SWHR2-C-0041@v1
  test("SWHR2-C-0041: Display Inventory lists each stock record with existing quantity, empty new-quantity entry and unmarked update marker", async ({
    page,
  }) => {
    await supplierWith(page, { "EST-1": 40, "EST-2": 0, "EST-3": 12 });
    await display(page);
    // the e2e database also holds the seeded records, so only the three rows under test are checked
    for (const [id, q] of [
      ["EST-1", "40"],
      ["EST-2", "0"],
      ["EST-3", "12"],
    ]) {
      const r = row(page, id).first();
      await expect(r).toBeVisible();
      await expect(r.getByText(new RegExp(`^${q}$`))).toBeVisible();
      await expect(r.getByRole("textbox")).toHaveValue("");
      await expect(r.getByRole("checkbox")).not.toBeChecked();
    }
  });

  // case: SWHR2-C-0042@v1
  test("SWHR2-C-0042: only marked rows are saved: EST-1 marked becomes 30, EST-2 unmarked stays 0", async ({
    page,
  }) => {
    await supplierWith(page, { "EST-1": 40, "EST-2": 0 });
    await display(page);
    await row(page, "EST-1").first().getByRole("textbox").fill("30");
    await row(page, "EST-1").first().getByRole("checkbox").check();
    await row(page, "EST-2").first().getByRole("textbox").fill("15");
    await page.getByRole("button", { name: /submit/i }).click();
    await page.goto("/supplier");
    await display(page);
    await expect(row(page, "EST-1").first().getByText(/^30$/)).toBeVisible();
    await expect(row(page, "EST-2").first().getByText(/^0$/)).toBeVisible();
    await expect(row(page, "EST-2").first().getByText(/^15$/)).toHaveCount(0);
  });
});
