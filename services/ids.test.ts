// @vitest-environment node
import { describe, expect, it } from "vitest";

import { loadApp } from "./customers/testHarness";

const NOT_BUILT = /VortexNotImplemented/;

describe("nextId", () => {
  it("[SWHR2-C-0217] the first three ids of the 1001 sequence are 10011, 10012 and 10013", async () => {
    await loadApp();
    const { nextId } = await import("./ids");
    expect([nextId("1001"), nextId("1001"), nextId("1001")]).toEqual(["10011", "10012", "10013"]);
  });

  it("[SWHR2-C-0219] a second request gets a different id and advances the same counter", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("./ids");
    const first = nextId("1001");
    const second = nextId("1001");
    expect(second).not.toBe(first);
    expect(client.query("select count(*) n from id_sequences").get()).toEqual({ n: 1 });
    expect(
      client.query("select next_value v from id_sequences where prefix = '1001'").get(),
    ).toEqual({ v: 2 });
  });

  it("[SWHR2-C-0218] a missing or empty prefix is refused and nothing is issued", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("./ids");
    for (const prefix of [undefined, null, ""]) {
      expect(() => nextId(prefix as unknown as string)).toThrow(/prefix/i);
    }
    expect(client.query("select count(*) n from id_sequences").get()).toEqual({ n: 0 });
    expect(nextId("1001")).toBe("10011");
  });

  it("[SWHR2-C-0224] if the sequence for a new prefix cannot be created, the request fails", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("./ids");
    expect(nextId("1001")).toBe("10011");
    client.exec(
      "create trigger fail_seq before insert on id_sequences begin select raise(abort, 'cannot create sequence'); end",
    );
    expect(() => nextId("9999")).toThrow(/cannot create sequence/);
    expect(client.query("select count(*) n from id_sequences where prefix = '9999'").get()).toEqual(
      { n: 0 },
    );
  });

  it("[SWHR2-C-0225] if the sequence store is unavailable, the request fails", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("./ids");
    expect(nextId("1001")).toBe("10011");
    client.close();
    let failure: unknown;
    try {
      nextId("1001");
    } catch (e) {
      failure = e;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).not.toMatch(NOT_BUILT);
  });
});
