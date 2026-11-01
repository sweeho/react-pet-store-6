import { describe, expect, it } from "vitest";

import { loadApp } from "./orders/harness.test";

// A missing table reads as no sequences, so a test fails on its assertions rather than on a query error.
const sequences = (client: import("bun:sqlite").Database) => {
  try {
    return client.query("select * from id_sequences order by prefix").all();
  } catch {
    return [];
  }
};

describe("nextId", () => {
  it("[SWHR2-C-0217] issues prefix + 1, 2, 3 from a sequence created on first use", async () => {
    await loadApp();
    const { nextId } = await import("./ids");
    expect([await nextId("1001"), await nextId("1001"), await nextId("1001")]).toEqual([
      "10011",
      "10012",
      "10013",
    ]);
  });

  it("[SWHR2-C-0219] keeps a separate counter per prefix and moves a counter by one", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("./ids");
    await nextId("1001");
    await nextId("2002");
    expect(await nextId("1001")).toBe("10012");
    expect(sequences(client)).toEqual([
      { prefix: "1001", next_value: 2 },
      { prefix: "2002", next_value: 1 },
    ]);
  });

  it("[SWHR2-C-0218] refuses a missing or empty prefix and leaves the sequences unchanged", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("./ids");
    const before = sequences(client);
    for (const prefix of [undefined, null, ""])
      await expect(
        Promise.resolve().then(() => nextId(prefix as unknown as string)),
      ).rejects.toThrow(/prefix/i);
    expect(sequences(client)).toEqual(before);
  });

  it("[SWHR2-C-0224] fails and issues nothing when the sequence cannot be created", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("./ids");
    client.exec(
      "create table if not exists id_sequences (prefix text primary key, next_value integer not null)",
    );
    client.exec(
      "create trigger fail_seq before insert on id_sequences begin select raise(abort, 'cannot create sequence'); end",
    );
    await expect(Promise.resolve().then(() => nextId("9999"))).rejects.toThrow(
      "cannot create sequence",
    );
    expect(sequences(client)).toEqual([]);
  });

  it("[SWHR2-C-0225] fails and issues nothing when the sequence store is unavailable", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("./ids");
    client.close();
    let issued: unknown;
    const failure = await Promise.resolve()
      .then(async () => {
        issued = await nextId("1001");
      })
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(failure).toBeInstanceOf(Error);
    expect(issued).toBeUndefined();
  });
});
