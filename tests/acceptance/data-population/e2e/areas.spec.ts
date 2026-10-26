import { expect, test } from "@playwright/test";

test.describe("installed application areas", () => {
  // case: SWHR2-C-0079@v1
  test("SWHR2-C-0079: /petstore answers with the storefront and the supplier and admin areas are available", async ({
    page,
    request,
  }) => {
    const store = await page.goto("/petstore");
    expect(store?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();
    for (const area of ["/supplier", "/admin"]) {
      const res = await request.get(area);
      expect(res.status(), area).toBeLessThan(400);
    }
  });
});
