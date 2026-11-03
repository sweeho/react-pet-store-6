import { expect, test, type Page } from "@playwright/test";

const PETS = ["Birds", "Fish", "Dogs", "Reptiles", "Cats"] as const;
// A 1800 px viewport gives the picture's panel about 1400 px; a 700 px viewport about 600 px.
const WIDE = { width: 1800, height: 900 };
const NARROW = { width: 700, height: 900 };

const picture = (p: Page) => p.getByRole("img", { name: "Pet selection map" });

async function clickCellCentre(page: Page, cell: number): Promise<void> {
  const box = (await picture(page).boundingBox())!;
  await page.mouse.click(box.x + (box.width * (cell + 0.5)) / 5, box.y + box.height / 2);
}

test.describe("choose a pet picture, wide screen", () => {
  test.use({ viewport: WIDE });

  // case: SWHR2-C-0290@v1
  test("SWHR2-C-0290: on a wide screen the pet picture spans its panel and each pet region lines up with its name cell", async ({
    page,
  }) => {
    await page.goto("/petstore");
    const img = picture(page);
    // The picture's own panel: the innermost section holding it, not an outer page section.
    const panel = page
      .locator("section", { has: img })
      .filter({ hasNot: page.locator("section", { has: img }) });
    await expect(panel).toHaveCount(1);
    const panelBox = (await panel.boundingBox())!;
    const imgBox = (await img.boundingBox())!;
    expect(panelBox.width).toBeGreaterThan(1000);
    expect(Math.abs(imgBox.x - panelBox.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(imgBox.x + imgBox.width - (panelBox.x + panelBox.width))).toBeLessThanOrEqual(
      2,
    );

    for (const name of PETS) {
      const links = panel.getByRole("link", { name, exact: true });
      const region = (await links.first().boundingBox())!;
      const cell = (await links.last().locator("xpath=..").boundingBox())!;
      expect(cell.y).toBeGreaterThanOrEqual(imgBox.y + imgBox.height - 2);
      expect(Math.abs(region.x - cell.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(region.x + region.width - (cell.x + cell.width))).toBeLessThanOrEqual(2);
    }
  });

  // case: SWHR2-C-0291@v1
  test("SWHR2-C-0291: on a wide screen, clicking the centre of the Cats picture cell opens the CATS category", async ({
    page,
  }) => {
    await page.goto("/petstore");
    await clickCellCentre(page, 4);
    await expect(page).toHaveURL(/\/petstore\/category\/CATS$/);
  });
});

test.describe("choose a pet picture, narrow screen", () => {
  test.use({ viewport: NARROW });

  // case: SWHR2-C-0292@v1
  test("SWHR2-C-0292: on a narrow screen, clicking the centre of the Dogs picture cell opens the DOGS category", async ({
    page,
  }) => {
    await page.goto("/petstore");
    await clickCellCentre(page, 2);
    await expect(page).toHaveURL(/\/petstore\/category\/DOGS$/);
  });
});
