import { describe, expect, it } from "vitest";

import { purchaseOrder } from "../orders/harness.test";
import { fromXml, parseExpiry, toXml } from "./purchase-order";

describe("purchase order document", () => {
  it("[SWHR2-C-0221] round-trips with root PurchaseOrder and the card elements in order", () => {
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

  it("[SWHR2-C-0221] writes the order date as yyyy-MM-dd and escapes markup in values", () => {
    const po = purchaseOrder("10011");
    po.billing = { ...po.billing, street: "1 <Main> & Sons" };
    po.orderDate = Date.UTC(2001, 8, 9, 1, 46, 40);
    const xml = toXml(po);
    expect(xml).toContain("2001-09-09");
    expect(fromXml(xml).billing.street).toBe("1 <Main> & Sons");
  });

  it("[SWHR2-C-0222] rejects a document whose root is not PurchaseOrder", () => {
    expect(() => fromXml("<Invoice><OrderId>1</OrderId></Invoice>")).toThrow(
      "PurchaseOrder element expected.",
    );
  });

  it("[SWHR2-C-0223] rejects a non-CreditCard element in the card position", () => {
    const xml = toXml(purchaseOrder("10011")).replace(/CreditCard/g, "DebitCard");
    expect(() => fromXml(xml)).toThrow("CreditCard element expected.");
  });
});

describe("card expiry text", () => {
  it("reads month and year from <month>/<year>", () => {
    expect(parseExpiry("12/2005")).toEqual({ month: 12, year: 2005 });
    expect(parseExpiry("3/2031")).toEqual({ month: 3, year: 2031 });
  });

  it("yields no month and year for text of another shape, with no default", () => {
    for (const t of ["", "Duke Express", "13/2005", "12-2005", "12/05"])
      expect(parseExpiry(t)).toBeNull();
  });
});
