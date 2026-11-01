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

/** The cart's own Check Out link, not a Checkout entry in the site navigation or header. */
const cartCheckOut = (p: Page) =>
  p
    .locator("a:not(nav a):not(header a):not([role=navigation] a)")
    .filter({ hasText: /^\s*(proceed to )?check ?out\s*$/i });

async function signIn(page: Page) {
  await page.goto("/petstore/signin");
  // /petstore/signin also carries the registration form, with its own User ID and password
  // fields and submit button; the sign-in form is the one without a repeat-password field.
  const form = page
    .locator("form")
    .filter({ has: page.getByLabel(/^password:?$/i) })
    .filter({
      hasNot: page.getByLabel(/^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i),
    });
  await form.getByLabel(/^user id:?$/i).fill("j2ee");
  await form.getByLabel(/^password:?$/i).fill("j2ee");
  await form.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
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

  // The case's steps open the cart after signing out, then sign on again as j2ee and open it once
  // more; its expected result is: "Both times the cart screen shows 'Your Shopping Cart is Empty.'"
  // case: SWHR2-C-0085@v1
  test("SWHR2-C-0085: signing out with EST-1 in the cart leaves the cart empty afterwards", async ({
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
    // Given a cart already holding 2 of EST-1: open the session's cart, then add EST-1 x 2
    // through the cart route with the page's own session cookie.
    await page.goto("/petstore/cart");
    const added = await page.request.post("/api/cart/items", {
      data: { itemId: "EST-1", quantity: 2 },
    });
    expect(added.ok()).toBe(true);
    await page.goto("/petstore/cart");
    const line = itemRow(page, "EST-1");
    await expect(line).toHaveCount(1);
    await expect(line.getByRole("link", { name: /Large Angelfish/ })).toHaveAttribute(
      "href",
      /item\/EST-1/,
    );
    await expect(removeIn(line)).toBeVisible();
    await expect(line.getByRole("textbox").or(line.getByRole("spinbutton"))).toHaveValue("2");
    await expect(line.getByText(/\$16\.50/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /update cart/i })).toBeVisible();
    // The cart total, $33.00, is shown outside the line row (a line total in the row does not count).
    await expect
      .poll(
        async () =>
          (await page.getByText(/\$33\.00/).count()) - (await line.getByText(/\$33\.00/).count()),
      )
      .toBeGreaterThan(0);
    await expect(cartCheckOut(page)).toHaveCount(1);
    await expect(cartCheckOut(page)).toBeVisible();
  });

  // case: SWHR2-C-0089@v1
  test("[SWHR2-C-0089] Check Out from a non-empty cart opens order information entry", async ({
    page,
  }) => {
    await signIn(page);
    await addItem(page, "EST-1");
    await page.goto("/petstore/cart");
    await cartCheckOut(page).click();
    await expect(page).toHaveURL(/checkout/);
    await expect(page.getByLabel(/^(street( address)?|address 1):?$/i).first()).toBeVisible();
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
    // The click lands on the cart screen, and the cart itself, reopened, holds EST-1 x 1.
    await expect(page).toHaveURL(/\/cart/);
    await page.goto("/petstore/cart");
    const line = itemRow(page, "EST-1");
    await expect(line).toHaveCount(1);
    await expect(line.getByRole("spinbutton").or(line.getByRole("textbox"))).toHaveValue("1");
  });

  // case: SWHR2-C-0097@v1
  test("SWHR2-C-0097: adding EST-2 from a search result puts it in the cart with quantity 1", async ({
    page,
  }) => {
    await page.goto("/");
    // The search field is the text field inside the search form (a search landmark, or the form
    // whose submit control is named Search), not any other text field on the home page.
    const searchForm = page
      .getByRole("search")
      .or(
        page.locator("form").filter({ has: page.getByRole("button", { name: /^\s*search\s*$/i }) }),
      )
      .first();
    const box = searchForm.getByRole("searchbox").or(searchForm.getByRole("textbox")).first();
    await box.fill("Angelfish");
    await box.press("Enter");
    await row(page, /Small Angelfish|EST-2/)
      .getByRole("button", { name: /add to cart/i })
      .or(row(page, /Small Angelfish|EST-2/).getByRole("link", { name: /add to cart/i }))
      .first()
      .click();
    // The click lands on the cart screen, and the cart itself, reopened, holds EST-2 x 1.
    await expect(page).toHaveURL(/\/cart/);
    await page.goto("/petstore/cart");
    const line = itemRow(page, "EST-2");
    await expect(line).toHaveCount(1);
    await expect(line.getByRole("spinbutton").or(line.getByRole("textbox"))).toHaveValue("1");
  });

  // case: SWHR2-C-0101@v1
  test("SWHR2-C-0101: placing an order empties the customer's cart", async ({ page }) => {
    await signIn(page);
    await addItem(page, "EST-1");
    await addItem(page, "EST-2");
    await page.goto("/petstore/cart");
    await expect(itemRow(page, "EST-1")).toHaveCount(1);
    await expect(itemRow(page, "EST-2")).toHaveCount(1);
    await cartCheckOut(page).click();
    // Fill in the order information (billing fields come first on the form).
    const fields: [RegExp, string][] = [
      [/^(first name|given name):?$/i, "ABC"],
      [/^(last name|family name):?$/i, "XYZ"],
      [/^(street( address)?|address 1):?$/i, "1 Main St"],
      [/^city:?$/i, "Palo Alto"],
      [/^(zip( code)?|postal code):?$/i, "94303"],
      [/^(phone|telephone)( number)?:?$/i, "555-555-5555"],
      [/^e-?mail:?$/i, "abc@xyz.com"],
    ];
    for (const [label, value] of fields) await page.getByLabel(label).first().fill(value);
    // Submit the order information form itself (the form holding the first-name field and a
    // submit control), never a header search or other page button whose name happens to match.
    const form = page
      .locator("form")
      .filter({ has: page.getByLabel(fields[0][0]) })
      .filter({ has: page.locator("button:not([type]), button[type=submit], input[type=submit]") })
      .first();
    await form.evaluate((f) => (f as HTMLFormElement).requestSubmit());
    // An optional confirm step (as in C-0174/C-0254): if a confirm/place-order button is offered
    // once the form is submitted, it is taken to place the order.
    const complete = page.getByRole("heading", { name: /your order is complete|order placed/i });
    const confirm = page
      .getByRole("button", { name: /^\s*(confirm|place order)/i })
      .and(page.locator(":not(header *):not(nav *):not([role=navigation] *)"))
      .first();
    await expect(complete.or(confirm).first()).toBeVisible();
    if (!(await complete.isVisible())) await confirm.click();
    // The order is confirmed: the order-complete screen is shown.
    await expect(complete).toBeVisible();
    await page.goto("/petstore/cart");
    await expect(page.getByText(EMPTY)).toBeVisible();
  });
});
