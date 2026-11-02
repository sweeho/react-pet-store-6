// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { fulfilment } from "./fulfilmentHarness";

describe("transitions", () => {
  it("[SWHR2-C-0129] a batch transition gets all messages in one hand-off", async () => {
    await fulfilment();
    const t = await import("./transitions");
    const spy = vi.fn();
    t.ORDER_TRANSITIONS.testStep = "spyBatch";
    t.registerTransition("spyBatch", { batch: spy });
    t.handOff("testStep", ["m1", "m2", "m3"]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual(["m1", "m2", "m3"]);
  });

  it("[SWHR2-C-0130] an unknown transition raises TransitionError with the reason", async () => {
    await fulfilment();
    const t = await import("./transitions");
    t.ORDER_TRANSITIONS.testStep = "NoSuchTransition";
    let err: Error | undefined;
    try {
      t.handOff("testStep", ["m1"]);
    } catch (e) {
      err = e as Error;
    }
    expect(err?.name).toBe("TransitionError");
    expect(err?.message).toMatch(/NoSuchTransition/);
    expect(err?.cause).toBeDefined();
  });
});
