import { expect, test, type Page } from "@playwright/test";

const ADMIN = {
  user: process.env.E2E_ADMIN_USER ?? "admin",
  pw: process.env.E2E_ADMIN_PASSWORD ?? "admin-pw",
};
const SUPPLIER = {
  user: process.env.E2E_SUPPLIER_USER ?? "supplier",
  pw: process.env.E2E_SUPPLIER_PASSWORD ?? "supplier-pw",
};
const LOGIN_ERROR =
  "You could not be authenticated with the information provided. Please check your Username and Password.";

/** The item page may repeat its Add to Cart control; take the first. */
const addToCart = (p: Page) =>
  p
    .getByRole("button", { name: /add to cart/i })
    .or(p.getByRole("link", { name: /add to cart/i }))
    .first();
/**
 * Wait for the POST to `path` that `act` sets off. A goto issued while such a fetch is in
 * flight aborts it, so its effect (a cart add, an admin sign-in or sign-out) can be lost.
 */
async function awaitPost(p: Page, path: string, act: () => Promise<void>) {
  const done = p.waitForResponse((r) => r.url().endsWith(path) && r.request().method() === "POST");
  await act();
  await done;
}
/** Click the item page's Add to Cart and wait for the add (POST /api/cart/items) to finish. */
const addItem = (p: Page) => awaitPost(p, "/api/cart/items", () => addToCart(p).click());
/** The cart row whose name links to item `id`'s detail page (rows show names, not ids). */
const itemRow = (p: Page, id: string) =>
  p.getByRole("row").filter({ has: p.locator(`a[href$="/item/${id}"]`) });

/**
 * The sign-in form. /petstore/signin also carries the registration form, which has its own
 * "Password" field, so page-level label lookups match twice; the registration form is the
 * one with a repeat-password field.
 */
const signInForm = (p: Page) =>
  p
    .locator("form")
    .filter({ has: p.getByLabel(/^password:?$/i) })
    .filter({
      hasNot: p.getByLabel(/^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i),
    });
const userIdField = (p: Page) => signInForm(p).getByLabel(/^user ?id:?$/i);
/** Links in the page body, not the shared header or nav. */
const bodyLink = (p: Page, name: RegExp) =>
  p.locator("a:not(header a, nav a)").filter({ hasText: name });
const displayInventory = (p: Page) =>
  p
    .getByRole("link", { name: /display inventory/i })
    .or(p.getByRole("button", { name: /display inventory/i }));
/** The cart page's own Check Out link (one, below the rows), not a header or nav control. */
const checkOut = (p: Page) => bodyLink(p, /^\s*check ?out\s*$/i);
/** Admin or supplier Log out control. */
const logOut = (p: Page) =>
  p.getByRole("button", { name: /log ?out/i }).or(p.getByRole("link", { name: /log ?out/i }));
/** Inventory rows: each carries a new-quantity entry and an update marker. */
const inventoryRows = (p: Page) =>
  p
    .getByRole("row")
    .filter({ has: p.getByRole("textbox") })
    .filter({ has: p.getByRole("checkbox") });

async function fillLogin(page: Page, user: string, pw: string) {
  const form = signInForm(page);
  await form.getByLabel(/^user ?id:?$/i).fill(user);
  await form.getByLabel(/^password:?$/i).fill(pw);
  await form.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
}

async function signInCustomer(page: Page) {
  await page.goto("/petstore/signin");
  await fillLogin(page, "j2ee", "j2ee");
  await expect(page.getByText(/^sign out$/i)).toBeVisible();
}

test.describe("sign-on", () => {
  // case: SWHR2-C-0252@v1
  test("SWHR2-C-0252: a visitor who is not signed in and checks out is sent to sign in first", async ({
    page,
  }) => {
    await page.goto("/petstore/item/EST-1");
    await addItem(page);
    await page.goto("/petstore/cart");
    await expect(itemRow(page, "EST-1")).toHaveCount(1);
    await checkOut(page).click();
    await expect(userIdField(page)).toBeVisible();
  });

  // case: SWHR2-C-0253@v1
  test("SWHR2-C-0253: a visitor who is not signed in and opens Account is sent to sign in first", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /^account$/i }).click();
    await expect(userIdField(page)).toBeVisible();
    // Requesting the edit-account page directly shows sign-in, not the account edit form.
    await page.goto("/petstore/account");
    await expect(userIdField(page)).toBeVisible();
    await expect(page.getByLabel(/^(first name|given name):?$/i)).toHaveCount(0);
  });

  // case: SWHR2-C-0254@v1
  test("SWHR2-C-0254: a signed-in customer enters shipping and billing without another sign-in prompt", async ({
    page,
  }) => {
    await signInCustomer(page);
    await page.goto("/petstore/item/EST-1");
    await addItem(page);
    await page.goto("/petstore/cart");
    await expect(itemRow(page, "EST-1")).toHaveCount(1);
    await checkOut(page).click();
    await expect(userIdField(page)).toHaveCount(0);
    // Fill in every billing and shipping field the form shows.
    const fields: [RegExp, string][] = [
      [/^(first name|given name):?$/i, "ABC"],
      [/^(last name|family name):?$/i, "XYZ"],
      [/^(street( address)?|address 1):?$/i, "1 Main St"],
      [/^city:?$/i, "Palo Alto"],
      [/^state:?$/i, "CA"],
      [/^(zip( code)?|postal code):?$/i, "94303"],
      [/^(phone|telephone)( number)?:?$/i, "555-555-5555"],
      [/^e-?mail:?$/i, "abc@xyz.com"],
    ];
    await expect(page.getByLabel(fields[0][0]).first()).toBeVisible();
    for (const [label, value] of fields)
      for (const input of await page.getByLabel(label).all()) await input.fill(value);
    const submit = page
      .getByRole("button", { name: /^\s*(submit|continue|next|place (your )?order)/i })
      .first();
    await submit.click();
    // The form is accepted: it gives way to the next order step (a confirm step if one is
    // offered, otherwise the order-complete screen), with no sign-in screen.
    await expect(page.getByLabel(fields[0][0])).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/petstore\/checkout\/?(\?|#|$)/);
    await expect(userIdField(page)).toHaveCount(0);
    await expect(page.getByText(/server error|shopping cart is empty/i)).toHaveCount(0);
    await expect(
      page
        .getByRole("button", { name: /confirm|place (your )?order/i })
        .or(page.getByRole("link", { name: /confirm|place (your )?order/i }))
        .or(
          page.getByText(
            /thank you|order (has been )?(placed|submitted|received)|your order is complete/i,
          ),
        )
        .first(),
    ).toBeVisible();
  });

  // case: SWHR2-C-0255@v1
  test("SWHR2-C-0255: moving from admin to supplier means signing out of admin and signing in to supplier", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillLogin(page, ADMIN.user, ADMIN.pw);
    await awaitPost(page, "/api/admin/sign-out", () => logOut(page).first().click());
    await page.goto("/admin");
    await expect(userIdField(page)).toBeVisible();
    await page.goto("/supplier");
    await expect(userIdField(page)).toBeVisible();
    await fillLogin(page, SUPPLIER.user, SUPPLIER.pw);
    // the supplier home screen: Display Inventory and Logout, no Login Error
    await expect(displayInventory(page).first()).toBeVisible();
    await expect(logOut(page).first()).toBeVisible();
    await expect(page.getByText("Login Error", { exact: true })).toHaveCount(0);
    await expect(userIdField(page)).toHaveCount(0);
  });

  // case: SWHR2-C-0256@v1
  test("SWHR2-C-0256: while signed in as administrator the supplier area is refused until signing out", async ({
    page,
  }) => {
    await page.goto("/admin");
    await awaitPost(page, "/api/admin/sign-in", () => fillLogin(page, ADMIN.user, ADMIN.pw));
    /** A visible refusal: the sign-in prompt is still shown, or an access-denied message. */
    const refused = (p: Page) =>
      userIdField(p)
        .or(
          p.getByText(
            /access denied|not authori[sz]ed|(sign|log) ?(out|off)( of| from)? (the )?admin(istrat(or|ion))?|signed in as (an? )?admin(istrator)?/i,
          ),
        )
        .first();
    // Without signing out, open the supplier area: signing in as supplier while still admin
    // is refused and does not open it.
    await page.goto("/supplier");
    await expect(userIdField(page)).toBeVisible();
    await fillLogin(page, SUPPLIER.user, SUPPLIER.pw);
    await expect(refused(page)).toBeVisible();
    await expect(displayInventory(page)).toHaveCount(0);
    // Display Inventory requested directly is refused and shows no inventory.
    await page.goto("/supplier/inventory");
    await expect(refused(page)).toBeVisible();
    await expect(inventoryRows(page)).toHaveCount(0);
    // After signing out of admin, the supplier area can be used.
    await page.goto("/admin");
    await awaitPost(page, "/api/admin/sign-out", () => logOut(page).first().click());
    await page.goto("/supplier");
    await fillLogin(page, SUPPLIER.user, SUPPLIER.pw);
    await displayInventory(page).first().click();
    await expect(inventoryRows(page).first()).toBeVisible();
  });

  // case: SWHR2-C-0257@v1
  test("SWHR2-C-0257: the admin area while not signed in shows User ID, Password and a submit control", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(userIdField(page)).toBeVisible();
    await expect(signInForm(page).getByLabel(/^password:?$/i)).toBeVisible();
    await expect(
      signInForm(page).getByRole("button", { name: /sign ?in|log ?in|submit/i }),
    ).toBeVisible();
  });

  // case: SWHR2-C-0258@v1
  test("SWHR2-C-0258: wrong admin credentials show Login Error, the set text and a link back to sign-in", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillLogin(page, "admin", "wrong");
    await expect(page.getByText("Login Error", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(LOGIN_ERROR)).toBeVisible();
    // the link back sits on the error page itself, not in a shared header or nav
    const back = bodyLink(page, /sign ?in|log ?in|try again|back/i).first();
    await expect(back).toBeVisible();
    await back.click();
    await expect(userIdField(page)).toBeVisible();
  });

  // case: SWHR2-C-0267@v1
  test("SWHR2-C-0267: the admin landing page describes the features and offers Launch tool and Log out", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillLogin(page, ADMIN.user, ADMIN.pw);
    // Each feature is described in page text, not merely named by a link, button or heading.
    const features: [string, RegExp][] = [
      ["sales", /\bsales\b/i],
      ["revenue", /\brevenue\b/i],
      ["orders by status", /\borders?\b[^.]*\bstatus|\bstatus\b[^.]*\borders?\b/i],
      [
        "approve or deny pending orders",
        /\bapprov\w*\b[^.]*\b(deny|denie\w*|reject\w*)|\b(deny|denie\w*|reject\w*)\b[^.]*\bapprov/i,
      ],
    ];
    const notControl = page.locator(
      ":not(a, button, h1, h2, h3, h4, h5, h6, [role=link], [role=button], [role=heading])",
    );
    for (const [name, description] of features)
      await expect(
        page.getByText(description).and(notControl).first(),
        `the landing page describes: ${name}`,
      ).toBeVisible();
    await expect(
      page
        .getByRole("link", { name: /launch/i })
        .or(page.getByRole("button", { name: /launch/i }))
        .first(),
    ).toBeVisible();
    await expect(logOut(page).first()).toBeVisible();
  });

  // case: SWHR2-C-0269@v1
  test("SWHR2-C-0269: signing out in Japanese shows the signed-out screen, empties the cart and keeps Japanese", async ({
    page,
  }) => {
    await signInCustomer(page);
    await page.goto("/?locale=ja_JP");
    for (const id of ["EST-1", "EST-2"]) {
      await page.goto(`/petstore/item/${id}`);
      await addItem(page);
    }
    await page.goto("/petstore/cart");
    await expect(itemRow(page, "EST-1")).toHaveCount(1);
    await expect(itemRow(page, "EST-2")).toHaveCount(1);
    await page
      .getByRole("link", { name: /sign out|サインアウト|ログアウト/i })
      .or(page.getByText(/sign out|サインアウト|ログアウト/i))
      .first()
      .click();
    // the "You are signed out" screen, with a link to sign in again
    await expect(
      page.getByText(/(サインアウト|ログアウト)(しました|されました|済み)/).first(),
    ).toBeVisible();
    await expect(page.getByText(/you are signed out/i)).toHaveCount(0);
    await expect(bodyLink(page, /sign ?in|log ?in|サインイン|ログイン/i).first()).toBeVisible();
    // the new session is still Japanese: an item page prices in yen, not dollars
    await page.goto("/petstore/item/EST-1");
    await expect(page.getByText(/[¥￥]\s?\d/).first()).toBeVisible();
    await expect(page.getByText(/\$\s?\d/)).toHaveCount(0);
    // the shopper is no longer signed on: the header offers no sign-out
    await expect(page.getByRole("link", { name: /sign out|サインアウト|ログアウト/i })).toHaveCount(
      0,
    );
    await page.goto("/");
    await page
      .getByRole("link", { name: /cart|カート/i })
      .first()
      .click();
    await expect(page).toHaveURL(/cart/);
    await expect(itemRow(page, "EST-1")).toHaveCount(0);
    await expect(itemRow(page, "EST-2")).toHaveCount(0);
  });
});
