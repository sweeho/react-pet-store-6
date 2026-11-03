import { expect, test } from "@playwright/test";

// Entry route of each area besides the storefront. Order processing uses its legacy context
// root /opc, as the storefront, supplier and administration areas keep /petstore, /supplier
// and /admin.
const AREAS = ["/supplier", "/opc", "/admin"];

test.describe("installed application areas", () => {
  // case: SWHR2-C-0079@v1
  test("SWHR2-C-0079: /petstore answers with the storefront and the supplier, admin and order-processing areas are available", async ({
    page,
  }) => {
    const store = await page.goto("/petstore");
    expect(store?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();

    for (const area of AREAS) {
      const res = await page.goto(area);
      const status = res?.status() ?? 0;
      // Never 404 or 5xx.
      expect(status, area).not.toBe(404);
      expect(status, area).toBeLessThan(500);
      // The SPA serves its Not Found page for unknown URLs with a 2xx status, so a
      // Not Found page is a 404 whatever the status says.
      await expect(page.getByText(/not found|404/i), area).toHaveCount(0);
      // HTTP 200, or the area's sign-in page.
      if (status !== 200) {
        await expect(page.getByLabel(/^password:?$/i).first(), area).toBeVisible();
      }
    }
  });
});
