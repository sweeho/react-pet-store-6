import { describe, expect, it } from "vitest";

import { routeFailure } from "./routeFailure";

describe("routeFailure", () => {
  it("[SWHR2-C-0091] routes a kind with its own entry to its page", () => {
    expect(routeFailure({ kind: "EmptyCartOrder", kinds: ["EmptyCartOrder", "AppFailure"] })).toBe(
      "/petstore/error/empty-cart",
    );
  });

  it("[SWHR2-C-0091] walks to the first parent kind with a page", () => {
    expect(
      routeFailure({ kind: "ItemNotFound", kinds: ["ItemNotFound", "CatalogError", "AppFailure"] }),
    ).toBe("/petstore/error/catalog");
  });

  it("[SWHR2-C-0092] falls back to the server error page", () => {
    expect(routeFailure({ kind: "Odd", kinds: ["Odd"] })).toBe("/petstore/error/server");
  });
});
