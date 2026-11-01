import { execFileSync } from "node:child_process";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

// The dev server's database file (db/client.ts resolves it from the project root).
const DB_FILE = path.join(process.cwd(), "sqlite.db");

// Playwright runs this file under Node, where bun:sqlite does not exist, so each statement runs
// in a bun child process against the same file. Returns every row of a query.
function sql(statement: string, ...params: string[]): Record<string, unknown>[] {
  const script = `
    const { Database } = require("bun:sqlite");
    const [file, statement, params] = JSON.parse(process.argv[1]);
    const db = new Database(file);
    try { console.log(JSON.stringify(db.query(statement).all(...params))); }
    finally { db.close(); }`;
  const out = execFileSync("bun", ["-e", script, JSON.stringify([DB_FILE, statement, params])], {
    encoding: "utf8",
  });
  return JSON.parse(out.trim() || "[]") as Record<string, unknown>[];
}

async function toCheckout(page: Page, itemId = "EST-1") {
  await page.goto("/petstore/signin");
  // /petstore/signin also carries the registration form, with its own "Password" field;
  // the sign-in form is the one without a repeat-password field.
  const signIn = page
    .locator("form")
    .filter({ has: page.getByLabel(/^password:?$/i) })
    .filter({
      hasNot: page.getByLabel(/^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i),
    });
  await signIn.getByLabel(/^user id:?$/i).fill("j2ee");
  await signIn.getByLabel(/^password:?$/i).fill("j2ee");
  await signIn.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
  // navigating before sign-in completes can abort the request and leave the visitor anonymous
  await expect(page.getByText(/^sign out$/i).first()).toBeVisible();
  await page.goto(`/petstore/item/${itemId}`);
  // every Add to Cart control on the item page adds this item, so any one of them will do
  await page
    .getByRole("button", { name: /add to cart/i })
    .or(page.getByRole("link", { name: /add to cart/i }))
    .first()
    .click();
  // the add lands on the cart (shopping cart); reopen it by its address rather than a "cart" link,
  // which could equally be an Add to Cart control
  await expect(page).toHaveURL(/\/petstore\/cart(\?|$)/);
  await page.goto("/petstore/cart");
  // the cart's own Check Out control, not a Checkout entry in the header or site navigation
  await page
    .locator(":is(a, button):not(header *):not(nav *):not([role=navigation] *)")
    .filter({ hasText: /^\s*(proceed to )?check ?out\s*$/i })
    .first()
    .click();
}

// The account values the checkout form is pre-filled with (C-0215: name, address, telephone and
// e-mail), per field label. Labels are anchored, allowing only a "billing"/"shipping" prefix, so a
// credit-card or other field whose label merely contains "state" or "city" is not picked up.
const label = (name: string) =>
  new RegExp(`^\\s*((billing|shipping)\\s+)?(${name})\\s*:?\\s*\\*?\\s*$`, "i");
const PREFILL: [RegExp, string][] = [
  [label("first name|given name"), "ABC"],
  [label("last name|family name"), "XYZ"],
  [label("address( line)?( 1)?|street( address)?"), "1 Main St"],
  [label("city"), "Palo Alto"],
  [label("state|state/province|province"), "CA"],
  [label("zip|zip code|postal code"), "94303"],
  [label("phone|telephone|telephone number|phone number"), "555-555-5555"],
  [label("e-?mail|e-?mail address"), "abc@xyz.com"],
];

// Outside the header and site navigation.
const inPage = ":not(header *):not(nav *):not([role=navigation] *)";
const complete = (page: Page) =>
  page.getByRole("heading", { name: /your order is complete|order placed/i }).first();
const serverError = (page: Page) => page.getByRole("heading", { name: /server error/i }).first();

// Submits the checkout form as shown by clicking its visible submit control, then takes an
// optional confirm step, until the order-complete or Server Error screen appears.
async function submitCheckout(page: Page) {
  const control = (name: RegExp) =>
    page
      .getByRole("button", { name })
      .and(page.locator(`*${inPage}:visible`))
      .first();
  const CONFIRM = /^\s*(confirm|place order)/i;
  const submit = control(/^\s*(submit|continue|next|confirm|place order)/i);
  // a submit control that already confirms the order is not followed by a confirm step
  const confirms = CONFIRM.test((await submit.getAttribute("value")) ?? (await submit.innerText()));
  await submit.click();
  const confirm = control(CONFIRM);
  const next = await Promise.race([
    complete(page)
      .waitFor()
      .then(() => "done"),
    serverError(page)
      .waitFor()
      .then(() => "done"),
    ...(confirms ? [] : [confirm.waitFor().then(() => "confirm")]),
  ]);
  if (next === "confirm") await confirm.click();
}

test.describe("checkout form", () => {
  // case: SWHR2-C-0215@v1
  test("SWHR2-C-0215: the billing and shipping form is pre-filled from the signed-in customer's account", async ({
    page,
  }) => {
    await toCheckout(page);
    // Every field carrying the label (billing and, where the form shows it, shipping) holds the
    // account value. Fields need not be on screen together: a shipping block behind a "ship to a
    // different address" step still has to carry the pre-filled values.
    for (const [name, value] of PREFILL) {
      const fields = page.getByLabel(name);
      await expect(fields.first(), `${name}`).toBeAttached();
      for (const field of await fields.all()) await expect(field, `${name}`).toHaveValue(value);
    }
  });

  // case: SWHR2-C-0216@v1
  test("SWHR2-C-0216: submitting the pre-filled form unchanged places the order with the pre-filled details", async ({
    page,
  }) => {
    await toCheckout(page);
    await submitCheckout(page);

    // The order went ahead: the shopper sees the order-complete screen with the order id, an id
    // from the "1001" sequence (SWHR2-R-0006).
    await expect(complete(page)).toBeVisible();
    const shown = (await page.locator("main").or(page.locator("body")).first().innerText()).match(
      /\b1001\d+\b/,
    );
    expect(shown, "order id on the order-complete screen").not.toBeNull();
    const orderId = shown![0];

    // No screen shows a stored order's billing and shipping details, so they are read from the
    // order store design.md (Data) documents: billing on the order header, shipping on its one
    // contact record (order_id is that record's primary key, so there is exactly one).
    const rows = (table: string) => sql(`select * from ${table} where order_id = ?`, orderId);
    await expect.poll(() => rows("op_purchase_orders").length, { timeout: 10_000 }).toBe(1);
    await expect.poll(() => rows("op_po_contacts").length, { timeout: 10_000 }).toBe(1);
    const row = (table: string) => rows(table)[0];
    const fields: [RegExp, string | RegExp][] = [
      [/(given|first)_?name/i, "ABC"],
      [/(family|last)_?name/i, "XYZ"],
      [/street|addr(ess)?_?1/i, "1 Main St"],
      [/city/i, "Palo Alto"],
      [/state/i, "CA"],
      [/zip|postal/i, "94303"],
      [/country/i, /^(USA|United States)$/],
      [/phone/i, "555-555-5555"],
      [/e_?mail/i, "abc@xyz.com"],
    ];
    for (const [which, stored] of [
      ["billing", row("op_purchase_orders")],
      ["shipping", row("op_po_contacts")],
    ] as const) {
      for (const [name, value] of fields) {
        const held = Object.keys(stored)
          .filter((k) => name.test(k))
          .map((k) => String(stored[k]));
        expect(held, `${which} ${name}`).toContainEqual(expect.stringMatching(value));
      }
    }
  });
});

test.describe("server error page", () => {
  // case: SWHR2-C-0212@v1
  // The failure is real and on the server: placement enqueues the order document on the
  // order.new channel in the messages table (design.md), and a trigger there makes that insert
  // throw "boom-test" for an order of EST-4 only, an item no other browser spec orders, so
  // specs placing orders in parallel are unaffected.
  test("SWHR2-C-0212: the Server Error page shows the message and trace and asks the shopper to notify the administrator", async ({
    page,
  }) => {
    await toCheckout(page, "EST-4");
    sql(`create trigger if not exists acc_c0212_boom before insert on messages
      when new.channel = 'order.new' and new.payload glob '*EST-4[^0-9]*'
      begin select raise(abort, 'boom-test'); end`);
    try {
      await submitCheckout(page);
      await expect(page.getByRole("heading", { name: /server error/i }).first()).toBeVisible();
      await expect(page.getByText(/boom-test/).first()).toBeVisible();
      // the technical trace: at least one stack frame (function, file:line:column)
      await expect(page.getByText(/\bat .+:\d+:\d+/).first()).toBeVisible();
      await expect(page.getByText(/notify (the )?administrator/i).first()).toBeVisible();
    } finally {
      sql("drop trigger if exists acc_c0212_boom");
    }
  });
});
