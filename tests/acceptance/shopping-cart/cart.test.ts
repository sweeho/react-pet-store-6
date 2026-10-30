// @vitest-environment node
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import {
  addToCart,
  call,
  cartApp,
  getCart,
  ids,
  qty,
  removeFromCart,
  seedCustomer,
  sessionOf,
} from "./harness";

async function model() {
  const app = await cartApp();
  const cart = await import("../../../services/cart");
  const view = async (c: Map<string, number>) => cart.lines(c, "en_US");
  return { app, cart, view };
}

describe("cart model", () => {
  // case: SWHR2-C-0080@v1
  it("SWHR2-C-0080: adding EST-1 x 5 to a cart without it creates a line with quantity 5", async () => {
    const { cart, view } = await model();
    const c = new Map<string, number>([["EST-2", 1]]);
    await cart.addItemWithQuantity(c, "EST-1", 5);
    const v = await view(c);
    expect(qty(v, "EST-1")).toBe(5);
    expect(qty(v, "EST-2")).toBe(1);
  });

  // case: SWHR2-C-0081@v1
  it("SWHR2-C-0081: adding EST-1 x 2 when the cart holds 3 sets the quantity to 2", async () => {
    const { cart, view } = await model();
    const c = new Map<string, number>([["EST-1", 3]]);
    await cart.addItemWithQuantity(c, "EST-1", 2);
    const v = await view(c);
    expect(ids(v)).toEqual(["EST-1"]);
    expect(qty(v, "EST-1")).toBe(2);
  });

  // case: SWHR2-C-0082@v1
  it("SWHR2-C-0082: listing a cart with EST-1, EST-2 and EST-3 returns each line exactly once", async () => {
    const { cart, view } = await model();
    const c = new Map<string, number>();
    for (const id of ["EST-1", "EST-2", "EST-3"]) await cart.addItem(c, id);
    const got = ids(await view(c));
    expect(got).toHaveLength(3);
    expect(new Set(got)).toEqual(new Set(["EST-1", "EST-2", "EST-3"]));
  });

  // case: SWHR2-C-0099@v1
  it("SWHR2-C-0099: deleting EST-1 x 5 removes the whole line and leaves EST-2 x 1", async () => {
    const { cart, view } = await model();
    const c = new Map<string, number>([
      ["EST-1", 5],
      ["EST-2", 1],
    ]);
    await cart.removeItem(c, "EST-1");
    const v = await view(c);
    expect(ids(v)).toEqual(["EST-2"]);
    expect(qty(v, "EST-2")).toBe(1);
  });

  // case: SWHR2-C-0100@v1
  it("SWHR2-C-0100: deleting EST-1 when it is not in the cart is a silent no-op", async () => {
    const { cart, view } = await model();
    const c = new Map<string, number>([["EST-2", 1]]);
    await expect(Promise.resolve(cart.removeItem(c, "EST-1"))).resolves.not.toThrow();
    const v = await view(c);
    expect(ids(v)).toEqual(["EST-2"]);
    expect(qty(v, "EST-2")).toBe(1);
  });
});

describe("cart routes", () => {
  // case: SWHR2-C-0083@v1
  it("SWHR2-C-0083: opening the cart in a new session creates an empty cart for that session", async () => {
    const app = await cartApp();
    const r = await getCart(app);
    expect(r.status).toBe(200);
    expect(ids(r.body)).toEqual([]);
    const cookies = sessionOf(r);
    expect(cookies.ps_sid).toBeTruthy();
    await addToCart(app, cookies, "EST-1");
    expect(ids((await getCart(app, cookies)).body)).toEqual(["EST-1"]);
  });

  // case: SWHR2-C-0090@v1
  // The case's expected result: "The response is the empty-cart order error page (its known heading
  // or text), and no order is created." Both halves are asserted below.
  it("SWHR2-C-0090: submitting an order with an empty cart shows the configured empty-cart error page", async () => {
    const app = await cartApp();
    await seedCustomer(app.client, "j2ee", "j2ee");
    const signed = await call(app, "../../../routes/api/session/sign-in.post", {
      method: "POST",
      url: "/api/session/sign-in",
      json: { userId: "j2ee", password: "j2ee", remember: false },
    });
    const r = await call(app, "../../../routes/api/orders/index.post", {
      method: "POST",
      url: "/api/orders",
      cookies: sessionOf(signed),
      json: { billing: {}, shipping: {} },
    });
    expect(r.status).toBe(422);
    expect((r.body as { kind?: string }).kind).toBe("EmptyCartOrder");
    // The application's error-page table resolves the reply to the empty-cart order error page,
    // and that page is what the shopper is shown: render it and read its text.
    const { routeFailure } = await import("../../../src/errors/routeFailure");
    expect(String(routeFailure(r.body as never))).toMatch(/empty-cart/);
    const Page = (await import("../../../src/pages/petstore/error/empty-cart")).default;
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Page)));
    const text = html.replace(/<[^>]+>/g, " ");
    expect(text).toMatch(/cart/i);
    expect(text).toMatch(/empty/i);
    expect(text).not.toMatch(/server error/i);
    expect(app.client.query("select count(*) n from op_purchase_orders").get()).toEqual({ n: 0 });
    expect(
      app.client.query("select count(*) n from messages where channel = 'order.new'").get(),
    ).toEqual({ n: 0 });
  });

  // case: SWHR2-C-0094@v1
  it("SWHR2-C-0094: a visitor who has not signed on can remove EST-1 with no role check refusing it", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    expect((await addToCart(app, cookies, "EST-1")).status).toBe(200);
    expect(ids((await getCart(app, cookies)).body)).toEqual(["EST-1"]);
    const r = await removeFromCart(app, cookies, "EST-1");
    expect(r.status).toBe(200);
    expect(ids((await getCart(app, cookies)).body)).toEqual([]);
  });

  // case: SWHR2-C-0095@v1
  it("SWHR2-C-0095: after a session ends its cart cannot be retrieved by a later session", async () => {
    const app = await cartApp();
    const s1 = sessionOf(await getCart(app));
    await addToCart(app, s1, "EST-1", 2);
    const before = (await getCart(app, s1)).body;
    expect(ids(before)).toEqual(["EST-1"]);
    expect(qty(before, "EST-1")).toBe(2);
    await call(app, "../../../routes/api/session/sign-out.post", {
      method: "POST",
      url: "/api/session/sign-out",
      cookies: s1,
    });
    expect(ids((await getCart(app, s1)).body)).toEqual([]);
    const s2 = await getCart(app);
    expect(ids(s2.body)).toEqual([]);
    expect(JSON.stringify(s2.body)).not.toContain("EST-1");
  });

  // case: SWHR2-C-0098@v1
  it("SWHR2-C-0098: removing EST-1 from a cart holding EST-1 and EST-2 leaves only EST-2", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    await addToCart(app, cookies, "EST-1");
    await addToCart(app, cookies, "EST-2");
    await removeFromCart(app, cookies, "EST-1");
    expect(ids((await getCart(app, cookies)).body)).toEqual(["EST-2"]);
  });
});

describe("failure routing", () => {
  // case: SWHR2-C-0091@v1
  it("SWHR2-C-0091: a specific failure with no mapping of its own is routed to the error page of the general kind it belongs to", async () => {
    const app = await cartApp();
    // A real request handler raises the item-not-found failure for an item that does not exist.
    const r = await call(app, "../../../routes/api/catalog/items/[itemId].get", {
      url: "/api/catalog/items/NO-SUCH-ITEM",
      params: { itemId: "NO-SUCH-ITEM" },
    });
    const failure = r.body as { kind: string; kinds: string[] };
    expect(failure.kinds).toContain("CatalogError");
    // The failure is more specific than the catalog kind it belongs to.
    expect(failure.kind).not.toBe("CatalogError");
    expect(failure.kinds[0]).toBe(failure.kind);
    // The application's own configured error-page table: no table is passed in.
    const { routeFailure } = await import("../../../src/errors/routeFailure");
    const serverError = routeFailure({ kind: "NoSuchKind", kinds: ["NoSuchKind"] });
    // The specific failure on its own has no mapping in that table ...
    expect(routeFailure({ kind: failure.kind, kinds: [failure.kind] })).toBe(serverError);
    // ... the general catalog kind has one ...
    const catalogPage = routeFailure({ kind: "CatalogError", kinds: ["CatalogError"] });
    expect(catalogPage).not.toBe(serverError);
    expect(String(catalogPage)).toMatch(/catalog/i);
    // ... and the raised failure is routed to that general catalog page.
    expect(routeFailure(failure as never)).toBe(catalogPage);
  });

  // case: SWHR2-C-0092@v1
  it("SWHR2-C-0092: a failure with no mapping for itself or any kind it belongs to gives a general server error", async () => {
    const app = await cartApp();
    const { H3, defineHandler } = await import("nitro/h3");
    // The application ships no route that raises an unmapped failure, so the case's test route is
    // supplied here. It is served behind the application's own middleware chain, in Nitro's
    // file-name order, and the failure is left to the application's error handling to answer.
    class UnmappedTestFailure extends Error {
      kind = "UnmappedTestFailure";
      kinds = ["UnmappedTestFailure"];
    }
    const encoding = (await import("../../../middleware/00.encoding")).default;
    const server = new H3()
      .use(encoding as never)
      .use(app.session as never)
      .get(
        "/api/test/unmapped",
        defineHandler(() => {
          throw new UnmappedTestFailure("unmapped");
        }),
      );
    const res = await server.fetch(new Request("http://localhost/api/test/unmapped"));
    expect(res.status).toBe(500);
    // Not one of the mapped error pages: the application's table routes it to the server error page.
    const { routeFailure } = await import("../../../src/errors/routeFailure");
    const page = String(
      routeFailure({ kind: "UnmappedTestFailure", kinds: ["UnmappedTestFailure"] }),
    );
    expect(page).toMatch(/server/i);
    expect(page).not.toMatch(/empty-cart|catalog/);
    expect(res.headers.get("location")).toBeNull();
  });
});
