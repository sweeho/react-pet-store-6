import { expect, test } from "@playwright/test";

/** The installed application areas, on a database seeded by `bun scripts/seed.ts` (playwright.config.ts). */
test("[SWHR2-C-0079] the storefront answers at /petstore and the sample shopper can sign in", async ({
  page,
}) => {
  const store = await page.goto("/petstore");
  expect(store?.status()).toBe(200);
  await expect(page.getByRole("heading").first()).toBeVisible();
  for (const area of ["/supplier", "/admin"]) {
    const res = await page.goto(area);
    expect(res?.status(), area).toBeLessThan(400);
    await expect(page.getByLabel(/^user ?id:?$/i), area).toBeVisible();
  }
  await page.goto("/petstore/signin");
  await page.getByLabel(/^user id:?$/i).fill("j2ee");
  await page.getByLabel(/^password:?$/i).fill("j2ee");
  await page.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
  await expect(page.getByText(/^sign out$/i)).toBeVisible();
});
