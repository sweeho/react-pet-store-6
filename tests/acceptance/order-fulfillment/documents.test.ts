// @vitest-environment node
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { H3Event } from "nitro/h3";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fulfilment, mod, supplierOrder } from "./harness";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DOC_CATALOG_PATH;
  delete process.env.DOC_FORMAT_MODE;
});

const build = async (
  input = supplierOrder("10011", [
    ["EST-1", 3],
    ["EST-2", 1],
  ]),
) => {
  const f = await fulfilment();
  return { f, xml: f.docs.buildSupplierOrder(input) as string };
};
const at = (xml: string, re: RegExp) => xml.search(re);

describe("supplier order document", () => {
  // case: SWHR2-C-0111@v1
  it("SWHR2-C-0111: building a supplier order document without an order identifier fails", async () => {
    const f = await fulfilment();
    expect(() => f.docs.buildSupplierOrder(supplierOrder(undefined))).toThrow(/order ?id/i);
  });

  // case: SWHR2-C-0112@v1
  it("SWHR2-C-0112: a shipping address with no phone gives an empty phone field", async () => {
    const input = supplierOrder("10011");
    (input.shipping as Record<string, unknown>).phone = undefined;
    const { xml } = await build(input);
    expect(xml).toMatch(/<Phone\s*\/>|<Phone>\s*<\/Phone>/i);
  });

  // case: SWHR2-C-0138@v1
  it("SWHR2-C-0138: an order placed at 2003-04-15 14:32 has the order date 2003-04-15", async () => {
    const { xml } = await build();
    expect(xml).toMatch(/<OrderDate>\s*2003-04-15\s*<\/OrderDate>/i);
  });

  // case: SWHR2-C-0139@v1
  it("SWHR2-C-0139: the supplier order document has its id, date, address fields and lines in the set order", async () => {
    const { xml } = await build();
    const order = [
      /order-?id/i,
      /order-?date/i,
      /first-?name/i,
      /last-?name/i,
      /street/i,
      /city/i,
      /state/i,
      /country/i,
      /zip/i,
      /e-?mail/i,
      /phone/i,
      /line-?item/i,
    ];
    const positions = order.map((re) => at(xml, re));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect((xml.match(/<LineItem[\s>]/gi) ?? []).length).toBe(2);
    expect(xml).toContain("10011");
  });

  // case: SWHR2-C-0140@v1
  it("SWHR2-C-0140: a supplier order document with no line items fails the format check", async () => {
    const f = await fulfilment();
    const xml = f.docs
      .buildSupplierOrder(supplierOrder("10011", [["EST-1", 1]]))
      .replace(/<LineItem[\s\S]*?<\/LineItem>/gi, "");
    const check = await Promise.resolve()
      .then(() => f.docs.validateSupplierOrder(xml))
      .then(
        (r: unknown) => r as { valid?: boolean },
        () => ({ valid: false }),
      );
    expect(check.valid).toBe(false);
  });

  // case: SWHR2-C-0141@v1
  it("SWHR2-C-0141: with no format mode set the document is UTF-8 and names its format by public identifier", async () => {
    const { xml } = await build();
    expect(xml).toMatch(/encoding="UTF-8"/i);
    expect(xml).toMatch(/<!DOCTYPE[^>]*PUBLIC/i);
  });

  // case: SWHR2-C-0142@v1
  it("SWHR2-C-0142: a deployment catalog overrides the built-in invoice format location without a network fetch", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "catalog-"));
    const local = path.join(dir, "invoice.dtd");
    writeFileSync(local, "<!ELEMENT Invoice ANY>");
    const catalog = path.join(dir, "catalog.xml");
    writeFileSync(catalog, `<catalog><system systemId="Invoice" uri="${local}"/></catalog>`);
    process.env.DOC_CATALOG_PATH = catalog;
    const net = vi.fn(() => {
      throw new Error("network fetch attempted");
    });
    vi.stubGlobal("fetch", net);
    await fulfilment();
    const cat = await mod("../../../services/documents/catalog");
    const resolved = await cat.resolveFormat("Invoice");
    expect(JSON.stringify(resolved)).toContain(local);
    expect(net).not.toHaveBeenCalled();
  });
});

describe("invoice and catalog", () => {
  // case: SWHR2-C-0108@v1
  it("SWHR2-C-0108: an invoice for order 10011 is read as shipped quantities EST-1: 3 and EST-2: 1", async () => {
    const f = await fulfilment();
    const r = f.invoices.readInvoice(
      f.invoiceFor("10011", [
        ["EST-1", 3],
        ["EST-2", 1],
      ]),
    );
    expect(String(r.orderId)).toBe("10011");
    const shipped =
      r.shipped ??
      Object.fromEntries(
        (r.lines as { itemId: string; quantity: number }[]).map((l) => [l.itemId, l.quantity]),
      );
    expect(shipped).toEqual({ "EST-1": 3, "EST-2": 1 });
  });

  // case: SWHR2-C-0109@v1
  it("SWHR2-C-0109: a supplier order document arriving on the invoice channel is rejected", async () => {
    const { f, xml } = await build();
    f.client.exec("insert into op_order_workflow (order_id, status) values ('10011', 'APPROVED')");
    expect(() => f.invoices.readInvoice(xml)).toThrow();
    expect(
      f.client.query("select status from op_order_workflow where order_id = '10011'").get(),
    ).toEqual({ status: "APPROVED" });
  });

  // case: SWHR2-C-0110@v1
  it("SWHR2-C-0110: the document format catalog maps supplier order, invoice and line item formats to absolute locations", async () => {
    await fulfilment();
    const route = (await import("../../../routes/schemas/catalog.xml.get")).default as (
      e: H3Event,
    ) => Promise<unknown>;
    const out = await route(new H3Event(new Request("http://localhost:5178/schemas/catalog.xml")));
    const text = out instanceof Response ? await out.text() : String(out);
    for (const id of [/supplier-?order/i, /invoice/i, /line-?item/i]) {
      const entry = text
        .split(/\r?\n|(?=<)/)
        .find((l) => id.test(l) && /http:\/\/localhost:5178\//.test(l));
      expect(entry).toBeDefined();
    }
  });
});
