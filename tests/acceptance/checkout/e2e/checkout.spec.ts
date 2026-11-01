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

async function toCheckout(page: Page) {
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
  await page.goto("/petstore/item/EST-1");
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
  const form = page
    .locator("form")
    .filter({ has: page.getByLabel(/^(first name|given name):?$/i) });
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
  test("SWHR2-C-0215: the billing and shipping form is pre-filled from the signed-in customer's account", async ({
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
  test("SWHR2-C-0216: submitting the pre-filled form unchanged places the order with the pre-filled details", async ({
    page,
  }) => {
    await toCheckout(page);
    const response = await submitCheckout(page);
    expect(response.status()).toBe(200);
    const { orderId } = (await response.json()) as { orderId: string };
    await expect(page.getByText(orderId).first()).toBeVisible();

    // The stored order (design.md, Data): billing details are columns of the op_purchase_orders
    // header, shipping details the single op_po_contacts record keyed by the order id. Each value
    // must sit in the column named for it, not just anywhere in the row.
    const rows = (table: string) => sql(`select * from ${table} where order_id = ?`, orderId);
    await expect.poll(() => rows("op_purchase_orders").length, { timeout: 10_000 }).toBe(1);
    await expect.poll(() => rows("op_po_contacts").length, { timeout: 10_000 }).toBe(1);
    const columns: [RegExp, string | RegExp][] = [
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
    for (const [which, row] of [
      ["billing", rows("op_purchase_orders")[0]],
      ["shipping", rows("op_po_contacts")[0]],
    ] as const) {
      for (const [name, value] of columns) {
        const named = Object.keys(row).filter((k) => name.test(k));
        expect(named, `${which} column ${name}`).not.toHaveLength(0);
        for (const k of named) expect(String(row[k]), `${which} ${k}`).toMatch(value);
      }
    }
  });
});

test.describe("server error page", () => {
  // case: SWHR2-C-0212@v1
  // The case stubs order placement to throw "boom-test". Here the stub is the placement route's
  // documented failure answer (design.md: 500 { kind: "AppFailure", message, trace }); that the
  // server answers a real throw that way is SWHR2-C-0212's integration test in orders.test.ts.
  test("SWHR2-C-0212: the Server Error page shows the message and trace and asks the shopper to notify the administrator", async ({
    page,
  }) => {
    await toCheckout(page);
    const frame = "at placeOrder (routes/api/orders/index.post.ts:42:11)";
    await page.route("**/api/orders", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            json: {
              kind: "AppFailure",
              message: "boom-test",
              trace: `Error: boom-test\n    ${frame}\n    at handler (node_modules/h3/dist/index.mjs:1:1)`,
            },
          })
        : route.fallback(),
    );
    expect((await submitCheckout(page)).status()).toBe(500);
    await expect(page.getByRole("heading", { name: /server error/i }).first()).toBeVisible();
    await expect(page.getByText(/boom-test/).first()).toBeVisible();
    // the technical trace: the stubbed failure's own stack frame
    await expect(page.getByText(frame).first()).toBeVisible();
    await expect(page.getByText(/notify (the )?administrator/i).first()).toBeVisible();
  });
});
