import { describe, expect, it } from "vitest";

import { routeFailure } from "./routeFailure";

describe("routeFailure", () => {
  it("[SWHR2-C-0091] routes a failure with no mapping of its own to the page of its general kind", () => {
    const page = routeFailure(
      { kind: "ItemNotFound", kinds: ["ItemNotFound", "CatalogError", "AppFailure"] },
      { CatalogError: "catalog-error" },
    );
    expect(page).toBe("catalog-error");
  });

  it("[SWHR2-C-0092] gives a general server error when no kind of the failure is mapped", () => {
    const page = routeFailure(
      { kind: "Weird", kinds: ["Weird", "AppFailure"] },
      { CatalogError: "catalog-error", EmptyCartOrder: "empty-cart" },
    );
    expect(page).toMatch(/server/i);
  });
});
