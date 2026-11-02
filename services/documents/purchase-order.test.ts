// @vitest-environment node
import { describe, expect, it } from "vitest";

import { purchaseOrder } from "../../tests/acceptance/checkout/harness";
import { fromXml, toXml } from "./purchase-order";

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

  it("[SWHR2-C-0222] a document with another root is rejected with 'PurchaseOrder element expected.'", () => {
    expect(() => fromXml("<Invoice><OrderId>1</OrderId></Invoice>")).toThrow(
      "PurchaseOrder element expected.",
    );
  });

  it("[SWHR2-C-0223] a non-CreditCard card element is rejected with 'CreditCard element expected.'", () => {
    const xml = toXml(purchaseOrder("10011")).replace(/CreditCard/g, "DebitCard");
    expect(() => fromXml(xml)).toThrow("CreditCard element expected.");
  });

  it("[SWHR2-C-0221] numeric-looking text such as a zip or card number keeps its leading zeros", () => {
    const po = purchaseOrder("10011");
    po.billing = { ...po.billing, zip: "00501" };
    expect(fromXml(toXml(po)).billing.zip).toBe("00501");
  });
});
