// @vitest-environment node
import { describe, expect, it } from "vitest";

import { loadApp, purchaseOrder } from "./harness";

const sequences = (client: import("bun:sqlite").Database) =>
  client.query("select * from id_sequences order by prefix").all();

describe("order document codec", () => {
  // case: SWHR2-C-0221@v1
  it("SWHR2-C-0221: a purchase order round-trips with root PurchaseOrder and card elements in order", async () => {
    const { toXml, fromXml } = await import("../../../services/documents/purchase-order");
    const po = purchaseOrder("10011");
    const xml = toXml(po);
    expect(xml).toMatch(/<PurchaseOrder[\s>]/);
    const card = /<CreditCard>([\s\S]*?)<\/CreditCard>/.exec(xml)?.[1] ?? "";
    expect([...card.matchAll(/<(\w+)>/g)].map((m) => m[1])).toEqual([
      "CardNumber",
      "CardType",
      "ExpiryDate",
    ]);
    expect(fromXml(xml)).toEqual(po);
  });

  // case: SWHR2-C-0223@v1
  it("SWHR2-C-0223: a non-CreditCard element in the card position is rejected with 'CreditCard element expected.'", async () => {
    const { toXml, fromXml } = await import("../../../services/documents/purchase-order");
    const xml = toXml(purchaseOrder("10011")).replace(/CreditCard/g, "DebitCard");
    expect(() => fromXml(xml)).toThrow("CreditCard element expected.");
  });
});

describe("id sequences", () => {
  // case: SWHR2-C-0218@v1
  it("SWHR2-C-0218: requesting an identifier without a prefix is refused and issues nothing", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("../../../services/ids");
    const before = sequences(client);
    for (const prefix of [undefined, ""]) {
      await expect(
        Promise.resolve().then(() => nextId(prefix as unknown as string)),
      ).rejects.toBeDefined();
    }
    expect(sequences(client)).toEqual(before);
  });

  // case: SWHR2-C-0224@v1
  it("SWHR2-C-0224: if creating a sequence for a new prefix fails, the request fails and issues nothing", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("../../../services/ids");
    client.exec(
      "create trigger fail_seq before insert on id_sequences begin select raise(abort, 'cannot create sequence'); end",
    );
    await expect(Promise.resolve().then(() => nextId("9999"))).rejects.toBeDefined();
    expect(client.query("select count(*) n from id_sequences where prefix = '9999'").get()).toEqual(
      { n: 0 },
    );
  });

  // case: SWHR2-C-0225@v1
  it("SWHR2-C-0225: if the sequence store is unavailable the request fails and issues nothing", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("../../../services/ids");
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

  // case: SWHR2-C-0225@v1
  it("SWHR2-C-0225: a sequence that cannot be written issues no identifier and moves no counter", async () => {
    const { client } = await loadApp();
    const { nextId } = await import("../../../services/ids");
    await nextId("1001");
    const before = sequences(client);
    client.exec(
      "create trigger no_bump before update on id_sequences begin select raise(abort, 'store unavailable'); end",
    );
    let issued: unknown;
    await Promise.resolve()
      .then(async () => {
        issued = await nextId("1001");
      })
      .catch(() => undefined);
    expect(issued).toBeUndefined();
    expect(sequences(client)).toEqual(before);
  });
});
