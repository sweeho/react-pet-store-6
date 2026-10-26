// @vitest-environment node
import { describe, expect, it } from "vitest";

import { purchaseOrder } from "../checkout/harness";
import { fulfilment } from "../order-fulfillment/harness";

describe("installed application areas", () => {
  // case: SWHR2-C-0079@v1
  it("SWHR2-C-0079: the order-processing area is available and accepts an order", async () => {
    // order processing is the in-process worker; hand it a new order directly, with no
    // sign-in, cart or checkout in the way, and it must store the order
    const f = await fulfilment();
    const { toXml } = await import("../../../services/documents/purchase-order");
    f.messaging.enqueue(f.db, "order.new", toXml(purchaseOrder("10079", [["EST-1", 1]])));
    await f.drain();
    expect(
      f.client.query("select count(*) n from op_purchase_orders where order_id = '10079'").get(),
    ).toEqual({ n: 1 });
  });
});
