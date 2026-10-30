import { describe, expect, it } from "vitest";

import { routeFailure } from "./routeFailure";

describe("routeFailure", () => {
  it("[SWHR2-C-0091] routes a specific failure to the page of its general kind", () => {
    const page = routeFailure(
      { kind: "ItemNotFound", kinds: ["ItemNotFound", "CatalogError", "AppFailure"] },
      { CatalogError: "catalog-error" },
    );
    expect(page).toBe("catalog-error");
  });

  it("[SWHR2-C-0092] an unmapped failure gives the general server error", () => {
    const page = routeFailure(
      { kind: "Weird", kinds: ["Weird", "AppFailure"] },
      { CatalogError: "catalog-error", EmptyCartOrder: "empty-cart" },
    );
    expect(page).toMatch(/server/i);
  });

  it("maps EmptyCartOrder to the empty-cart error page by default", () => {
    expect(
      routeFailure({
        kind: "EmptyCartOrder",
        kinds: ["EmptyCartOrder", "OrderFailure", "AppFailure"],
      }),
    ).toBe("/petstore/error/empty-cart");
  });
});
