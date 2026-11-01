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
  await page.goto(`/petstore/item/${itemId}`);
  // every Add to Cart control on the item page adds this item, so any one of them will do
  await page
    .getByRole("button", { name: /add to cart/i })
    .or(page.getByRole("link", { name: /add to cart/i }))
    .first()
    .click();
  await page.getByRole("link", { name: /cart/i }).first().click();
  // every Check Out control (cart button, header link) leads to the same checkout form
  await page
    .getByRole("button", { name: /^\s*(proceed to )?check ?out\s*$/i })
    .or(page.getByRole("link", { name: /^\s*(proceed to )?check ?out\s*$/i }))
    .first()
    .click();
}

// The account values the checkout form is pre-filled with, per field label.
const PREFILL: [RegExp, string | RegExp][] = [
  [/first name|given name/i, "ABC"],
  [/last name|family name/i, "XYZ"],
  [/address 1|street/i, "1 Main St"],
  [/city/i, "Palo Alto"],
  [/state/i, "CA"],
  [/zip|postal/i, "94303"],
  // the account stores the United States as USA; the form may label that option "United States"
  [/country/i, /^(USA|United States)$/],
  [/phone|telephone/i, "555-555-5555"],
  [/e-?mail/i, "abc@xyz.com"],
];

// Submits the checkout form as shown, then confirms the order if a confirm step follows.
async function submitCheckout(page: Page) {
  const placed = page.waitForResponse(
    (r) => r.url().endsWith("/api/orders") && r.request().method() === "POST",
  );
  // the checkout form: the one holding a first-name field and a submit control (first match, so
  // separate billing and shipping forms cannot trip strict mode)
  const form = page
    .locator("form")
    .filter({ has: page.getByLabel(/^(first name|given name):?$/i) })
    .filter({ has: page.locator("button:not([type]), button[type=submit], input[type=submit]") })
    .first();
  await form.evaluate((f) => (f as HTMLFormElement).requestSubmit());
  const confirm = page.getByRole("button", { name: /^\s*(confirm|place order)/i }).first();
  const next = await Promise.race([
    placed.then(() => "placed"),
    confirm.waitFor().then(
      () => "confirm",
      () => "placed",
    ),
  ]);
  if (next === "confirm") await confirm.click();
  return placed;
}

test.describe("checkout form", () => {
  // case: SWHR2-C-0215@v1
  test("[SWHR2-C-0215] the billing and shipping form is pre-filled from the signed-in customer's account", async ({
    page,
  }) => {
    await toCheckout(page);
    // one field per label in the billing block and one in the shipping block: both hold the value
    for (const [label, value] of PREFILL) {
      const fields = page.getByLabel(label);
      await expect(fields, `billing and shipping ${label}`).toHaveCount(2);
      await expect(fields.nth(0)).toHaveValue(value);
      await expect(fields.nth(1)).toHaveValue(value);
    }
  });

  // case: SWHR2-C-0216@v1
  test("[SWHR2-C-0216] submitting the pre-filled form unchanged places the order with the pre-filled details", async ({
    page,
  }) => {
    await toCheckout(page);
    const { orderId } = (await (await submitCheckout(page)).json()) as { orderId: string };

    // The order went ahead: it is stored (design.md, Data), billing details on the
    // op_purchase_orders header, shipping details on its op_po_contacts record. Each pre-filled
    // value must be held by a column named for its field, not just anywhere in the row.
    const row = (table: string) => sql(`select * from ${table} where order_id = ?`, orderId)[0];
    await expect.poll(() => row("op_purchase_orders"), { timeout: 10_000 }).toBeTruthy();
    await expect.poll(() => row("op_po_contacts"), { timeout: 10_000 }).toBeTruthy();
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
