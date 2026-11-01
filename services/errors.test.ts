import { describe, expect, it } from "vitest";

import { AppFailure, EmptyCartOrder, ItemNotFound, failureReply, guardRoute } from "./errors";

describe("failure hierarchy", () => {
  it("[SWHR2-C-0091] ItemNotFound lists itself and its parent kinds", () => {
    expect(failureReply(new ItemNotFound("x")).kinds).toEqual([
      "ItemNotFound",
      "CatalogError",
      "AppFailure",
    ]);
  });

  it("[SWHR2-C-0091] EmptyCartOrder belongs to OrderFailure", () => {
    expect(failureReply(new EmptyCartOrder("x")).kinds).toEqual([
      "EmptyCartOrder",
      "OrderFailure",
      "AppFailure",
    ]);
  });
});

describe("guardRoute", () => {
  it("[SWHR2-C-0091] rethrows an AppFailure with its status and reply as data", async () => {
    const err = await guardRoute(() => Promise.reject(new ItemNotFound("gone"))).catch((e) => e);
    expect(err.status).toBe(404);
    expect(err.data).toMatchObject({ kind: "ItemNotFound", message: "gone" });
  });

  it("[SWHR2-C-0092] turns an unexpected error into a 500 AppFailure keeping the message", async () => {
    const err = await guardRoute(() => {
      throw new Error("boom");
    }).catch((e) => e);
    expect(err.status).toBe(500);
    expect(err.data).toMatchObject({ kind: "AppFailure", kinds: ["AppFailure"], message: "boom" });
    expect(new AppFailure("x").kind).toBe("AppFailure");
  });

  it("[SWHR2-C-0092] passes a result through", async () => {
    expect(await guardRoute(async () => 7)).toBe(7);
  });
});
