import { expect, test, type Page } from "@playwright/test";

const EMPTY = "Your Shopping Cart is Empty.";
const addBtn = (p: Page) =>
  p.getByRole("button", { name: /add to cart/i }).or(p.getByRole("link", { name: /add to cart/i }));
const row = (p: Page, text: string | RegExp) => p.getByRole("row").filter({ hasText: text });
/** The cart row whose name links to item `id`'s detail page (exact id, so EST-1 never picks EST-10). */
const itemRow = (p: Page, id: string) =>
  p.getByRole("row").filter({ has: p.locator(`a[href$="/item/${id}"]`) });
const removeIn = (r: ReturnType<Page["getByRole"]>) =>
  r.getByRole("button", { name: /remove/i }).or(r.getByRole("link", { name: /remove/i }));

async function signIn(page: Page) {
  await page.goto("/petstore/signin");
  await page.getByLabel(/user id/i).fill("j2ee");
  // The sign-up form on the same page has its own password fields; use the sign-in form's.
  await page
    .locator("form")
    .filter({ has: page.getByLabel(/user id/i) })
    .getByLabel(/password/i)
    .fill("j2ee");
  await page.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
  await expect(page.getByText(/^sign out$/i)).toBeVisible();
}
async function addItem(page: Page, id: string) {
  await page.goto(`/petstore/item/${id}`);
  await addBtn(page).click();
}

test.describe("shopping cart", () => {
  // case: SWHR2-C-0084@v1
  test("SWHR2-C-0084: an item added in one session does not appear in another session's cart", async ({
    browser,
  }) => {
    const a = await (await browser.newContext()).newPage();
    const b = await (await browser.newContext()).newPage();
    await addItem(a, "EST-1");
    await a.goto("/petstore/cart");
    await expect(a.getByText(/Large Angelfish|EST-1/).first()).toBeVisible();
    await b.goto("/petstore/cart");
    await expect(b.getByText(EMPTY)).toBeVisible();
  });

  // case: SWHR2-C-0085@v1
  test("SWHR2-C-0085: signing out with EST-1 in the cart leaves the cart empty, also after signing on again", async ({
    page,
  }) => {
    await signIn(page);
    await addItem(page, "EST-1");
    await page.goto("/petstore/cart");
    await expect(itemRow(page, "EST-1")).toHaveCount(1);
    await page.getByText(/^sign out$/i).click();
    await page.goto("/petstore/cart");
    await expect(page.getByText(EMPTY)).toBeVisible();
    await signIn(page);
    await page.goto("/petstore/cart");
    await expect(page.getByText(EMPTY)).toBeVisible();
  });

  // case: SWHR2-C-0088@v1
  test("SWHR2-C-0088: Remove on the EST-1 row redisplays the cart showing only EST-2", async ({
    page,
  }) => {
    await addItem(page, "EST-1");
    await addItem(page, "EST-2");
    await page.goto("/petstore/cart");
    await expect(itemRow(page, "EST-1")).toHaveCount(1);
    await expect(itemRow(page, "EST-2")).toHaveCount(1);
    await removeIn(itemRow(page, "EST-1")).click();
    // The redisplayed cart has a single line row (one Remove control), and it is EST-2.
    const lines = page.getByRole("row").filter({
      has: page
        .getByRole("button", { name: /remove/i })
        .or(page.getByRole("link", { name: /remove/i })),
    });
    await expect(lines).toHaveCount(1);
    await expect(itemRow(page, "EST-2")).toHaveCount(1);
    await expect(itemRow(page, "EST-1")).toHaveCount(0);
  });

  // Regression for SWHR2-T-0248 (SWHR2-R-0115): the served cart screen, not a stubbed fetch,
  // must carry the row controls and the Update Cart / total / Check Out block.
  // case: SWHR2-C-0086@v1
  test("[SWHR2-C-0086] the served cart screen with 2 x Large Angelfish shows the linked name, Remove, quantity 2, $16.50, Update Cart, total $33.00 and Check Out", async ({
    page,
  }) => {
    await addItem(page, "EST-1");
    await page.goto("/petstore/cart");
    const qtyField = (p: Page) =>
      row(p, /Large Angelfish/)
        .getByRole("textbox")
        .or(row(p, /Large Angelfish/).getByRole("spinbutton"));
    await qtyField(page).fill("2");
    await page.getByRole("button", { name: /update cart/i }).click();
    const line = row(page, /Large Angelfish/);
    await expect(qtyField(page)).toHaveValue("2");
    await expect(line.getByRole("link", { name: /Large Angelfish/ })).toHaveAttribute(
      "href",
      /item\/EST-1/,
    );
    await expect(
      line.getByRole("button", { name: /remove/i }).or(line.getByRole("link", { name: /remove/i })),
    ).toBeVisible();
    await expect(line.getByText(/\$16\.50/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /update cart/i })).toBeVisible();
    // The cart total for 2 x 16.50, shown below the row.
    await expect(page.getByText(/\$33\.00/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /check ?out/i })).toBeVisible();
  });

  // case: SWHR2-C-0089@v1
  test("SWHR2-C-0089: Check Out from a non-empty cart opens order information entry", async ({
    page,
  }) => {
    await signIn(page);
    await addItem(page, "EST-1");
    await page.goto("/petstore/cart");
    await page.getByRole("link", { name: /check ?out/i }).click();
    await expect(page).toHaveURL(/checkout/);
    await expect(page.getByLabel(/street|address 1/i).first()).toBeVisible();
  });

  // case: SWHR2-C-0093@v1
  test("SWHR2-C-0093: a visitor who has not signed on can add EST-1 without being sent to sign on", async ({
    page,
  }) => {
    const urls: string[] = [];
    page.on("framenavigated", (f) => urls.push(f.url()));
    await page.goto("/petstore/product/FI-SW-01");
    await row(page, "EST-1")
      .getByRole("button", { name: /add to cart/i })
      .or(row(page, "EST-1").getByRole("link", { name: /add to cart/i }))
      .first()
      .click();
    // The browser lands on the cart screen, and EST-1 is a line in it.
    await expect(page).toHaveURL(/\/cart/);
    const line = row(page, /Large Angelfish|EST-1/);
    await expect(line.getByRole("spinbutton").or(line.getByRole("textbox"))).toHaveValue("1");
    await page.goto("/petstore/cart");
    await expect(row(page, /Large Angelfish|EST-1/)).toHaveCount(1);
    expect(urls.filter((u) => /signin|sign-in/i.test(u))).toEqual([]);
  });

  // case: SWHR2-C-0096@v1
  test("SWHR2-C-0096: adding EST-1 from the product listing puts it in the cart with quantity 1", async ({
    page,
  }) => {
    await page.goto("/petstore/product/FI-SW-01");
    await row(page, "EST-1")
      .getByRole("button", { name: /add to cart/i })
      .or(row(page, "EST-1").getByRole("link", { name: /add to cart/i }))
      .first()
      .click();
    await expect(
      row(page, /Large Angelfish|EST-1/)
        .getByRole("spinbutton")
        .or(row(page, /Large Angelfish|EST-1/).getByRole("textbox")),
    ).toHaveValue("1");
  });

  // case: SWHR2-C-0097@v1
  test("SWHR2-C-0097: adding EST-2 from a search result puts it in the cart with quantity 1", async ({
    page,
  }) => {
    await page.goto("/");
    const box = page.getByRole("searchbox").or(page.getByRole("textbox")).first();
    await box.fill("Angelfish");
    await box.press("Enter");
    await row(page, /Small Angelfish|EST-2/)
      .getByRole("button", { name: /add to cart/i })
      .or(row(page, /Small Angelfish|EST-2/).getByRole("link", { name: /add to cart/i }))
      .first()
      .click();
    await expect(
      row(page, /Small Angelfish|EST-2/)
        .getByRole("spinbutton")
        .or(row(page, /Small Angelfish|EST-2/).getByRole("textbox")),
    ).toHaveValue("1");
  });

  // case: SWHR2-C-0101@v1
  test("SWHR2-C-0101: placing an order empties the customer's cart", async ({ page }) => {
    await signIn(page);
    await addItem(page, "EST-1");
    await addItem(page, "EST-2");
    await page.goto("/petstore/cart");
    await expect(itemRow(page, "EST-1")).toHaveCount(1);
    await expect(itemRow(page, "EST-2")).toHaveCount(1);
    await page.getByRole("link", { name: /check ?out/i }).click();
    // Fill in the order information (billing fields come first on the form).
    const fields: [RegExp, string][] = [
      [/first name|given name/i, "ABC"],
      [/last name|family name/i, "XYZ"],
      [/address 1|street/i, "1 Main St"],
      [/city/i, "Palo Alto"],
      [/zip|postal/i, "94303"],
      [/phone|telephone/i, "555-555-5555"],
      [/e-?mail/i, "abc@xyz.com"],
    ];
    for (const [label, value] of fields) await page.getByLabel(label).first().fill(value);
    const placed = page.waitForResponse(
      (r) => r.request().method() === "POST" && /\/api\/orders$/.test(r.url()),
    );
    await page
      .getByRole("button", { name: /continue|submit|place|confirm/i })
      .first()
      .click();
    const res = await placed;
    expect(res.status()).toBe(200);
    const { orderId } = (await res.json()) as { orderId: string };
    expect(orderId).toMatch(/^1001\d+$/);
    // The order is confirmed to the customer with its id.
    await expect(page.getByText(orderId).first()).toBeVisible();
    await page.goto("/petstore/cart");
    await expect(page.getByText(EMPTY)).toBeVisible();
  });
});
