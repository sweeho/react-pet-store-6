// @vitest-environment node
import { describe, expect, it } from "vitest";

import { fulfilment, messages, supplierOrder } from "./fulfilmentHarness";

describe("invoice receipt", () => {
  it("[SWHR2-C-0108] reads shipped quantities", async () => {
    const f = await fulfilment();
    const r = f.invoices.readInvoice(
      f.invoiceFor("10011", [
        ["EST-1", 3],
        ["EST-2", 1],
      ]),
    );
    expect(r.orderId).toBe("10011");
    expect(r.shipped).toEqual({ "EST-1": 3, "EST-2": 1 });
  });

  it("[SWHR2-C-0109] rejects a supplier order document", async () => {
    const f = await fulfilment();
    const xml = f.docs.buildSupplierOrder(supplierOrder("10011"));
    expect(() => f.invoices.readInvoice(xml)).toThrow();
    await f.approvedOrder("10011", [["EST-1", 3]]);
    f.messaging.enqueue(f.db, "supplier.invoice", xml);
    await f.worker.processDue();
    const row = messages(f.client, "supplier.invoice", "%10011%").find(
      (m) => m.subscriber === "order-processing.invoice",
    )!;
    expect(row.status).toBe("pending");
    expect(row.attempts).toBeGreaterThan(0);
  });

  it("[SWHR2-C-0268] an invoice updates order lines with no session", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10011", [["EST-1", 2]]);
    f.invoices.handleInvoice(f.invoiceFor("10011", [["EST-1", 2]]));
    expect(f.client.query("select quantity_shipped q from op_po_line_items").get()).toEqual({
      q: 2,
    });
  });
});
