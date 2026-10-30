import { describe, expect, it } from "vitest";

import { AppFailure, EmptyCartOrder, failureBody } from "./errors";

describe("failureBody", () => {
  it("lists an EmptyCartOrder's kinds from specific to general", () => {
    const body = failureBody(new EmptyCartOrder("cart is empty"));
    expect(body.kind).toBe("EmptyCartOrder");
    expect(body.kinds).toEqual(["EmptyCartOrder", "OrderFailure", "AppFailure"]);
    expect(body.message).toBe("cart is empty");
    expect(new EmptyCartOrder().status).toBe(422);
  });

  it("treats an untyped error as a general AppFailure", () => {
    expect(failureBody(new Error("boom")).kinds).toEqual(["AppFailure"]);
    expect(new AppFailure().status).toBe(500);
  });
});
