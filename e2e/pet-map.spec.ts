import { expect, test } from "@playwright/test";

const PETS = ["Birds", "Fish", "Dogs", "Reptiles", "Cats"] as const;

for (const width of [700, 1800]) {
  test.describe(`Choose a pet picture at viewport ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("spans its panel and lines up with the name cells", async ({ page }) => {
      await page.goto("/petstore");
      const img = page.getByRole("img", { name: /pet/i });
      const panel = page.locator("section", { has: img });
      const panelBox = (await panel.boundingBox())!;
      const imgBox = (await img.boundingBox())!;
      expect(Math.abs(imgBox.x - panelBox.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(imgBox.width - (panelBox.width - 2))).toBeLessThanOrEqual(3);

      for (const name of PETS) {
        const [region, nameLink] = await panel.getByRole("link", { name, exact: true }).all();
        const r = (await region.boundingBox())!;
        const c = (await nameLink.locator("xpath=..").boundingBox())!;
        expect(Math.abs(r.x - c.x)).toBeLessThanOrEqual(2);
        expect(Math.abs(r.x + r.width - (c.x + c.width))).toBeLessThanOrEqual(2);
      }
    });

    test("selecting the centre of a picture cell opens that pet's category", async ({ page }) => {
      for (const [i, name] of [
        [4, "CATS"],
        [2, "DOGS"],
      ] as const) {
        await page.goto("/petstore");
        const box = (await page.getByRole("img", { name: /pet/i }).boundingBox())!;
        await page.mouse.click(box.x + (box.width * (i + 0.5)) / 5, box.y + box.height / 2);
        await expect(page).toHaveURL(new RegExp(`/petstore/category/${name}$`));
      }
    });
  });
}
