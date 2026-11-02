// @vitest-environment node
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { H3Event } from "nitro/h3";

import { fulfilment, supplierOrder } from "../orders/fulfilmentHarness";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DOC_CATALOG_PATH;
});

const two = () =>
  supplierOrder("10011", [
    ["EST-1", 3],
    ["EST-2", 1],
  ]);

describe("supplier order document", () => {
  it("[SWHR2-C-0111] a missing order id fails", async () => {
    const f = await fulfilment();
    expect(() => f.docs.buildSupplierOrder(supplierOrder(undefined))).toThrow(/order ?id/i);
  });

  it("[SWHR2-C-0112] a missing phone is an empty field", async () => {
    const f = await fulfilment();
    const input = supplierOrder("10011");
    (input.shipping as Record<string, unknown>).phone = undefined;
    expect(f.docs.buildSupplierOrder(input)).toMatch(/<Phone\s*\/>|<Phone><\/Phone>/);
  });

  it("[SWHR2-C-0138] the order date has no time of day", async () => {
    const f = await fulfilment();
    expect(f.docs.buildSupplierOrder(two())).toContain("<OrderDate>2003-04-15</OrderDate>");
  });

  it("[SWHR2-C-0139] fields appear in the set order", async () => {
    const f = await fulfilment();
    const xml = f.docs.buildSupplierOrder(two()) as string;
    const names = [
      "OrderId",
      "OrderDate",
      "FirstName",
      "LastName",
      "Street",
      "City",
      "State",
      "Country",
      "ZipCode",
      "Email",
      "Phone",
      "LineItem",
    ];
    const at = names.map((n) => xml.indexOf(`<${n}`));
    expect(at.every((p) => p >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(xml.match(/<LineItem[\s>]/g)).toHaveLength(2);
    const back = f.docs.readSupplierOrder(xml);
    expect(back.orderId).toBe("10011");
    expect(back.lines).toHaveLength(2);
    expect(back.lines[0].unitPrice).toBe(1650);
  });

  it("[SWHR2-C-0140] a document with no line items is invalid", async () => {
    const f = await fulfilment();
    const xml = (f.docs.buildSupplierOrder(two()) as string).replace(
      /<LineItem[\s\S]*?<\/LineItem>/g,
      "",
    );
    expect(f.docs.validateSupplierOrder(xml).valid).toBe(false);
    expect(f.docs.validateSupplierOrder(f.docs.buildSupplierOrder(two())).valid).toBe(true);
  });

  it("[SWHR2-C-0141] default is UTF-8 with a public identifier", async () => {
    const f = await fulfilment();
    const xml = f.docs.buildSupplierOrder(two()) as string;
    expect(xml).toMatch(/encoding="UTF-8"/);
    expect(xml).toMatch(/<!DOCTYPE[^>]*PUBLIC/);
  });

  it("[SWHR2-C-0142] a deployment catalog wins without a network fetch", async () => {
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
    const { resolveFormat } = await import("./catalog");
    expect(JSON.stringify(await resolveFormat("Invoice"))).toContain(local);
    expect(net).not.toHaveBeenCalled();
  });

  it("[SWHR2-C-0110] the catalog route maps formats to absolute locations", async () => {
    await fulfilment();
    const route = (await import("../../routes/schemas/catalog.xml.get")).default as unknown as (
      e: H3Event,
    ) => Promise<unknown>;
    const out = await route(new H3Event(new Request("http://localhost:5178/schemas/catalog.xml")));
    const text = out instanceof Response ? await out.text() : String(out);
    for (const id of [/supplier-?order/i, /invoice/i, /line-?item/i])
      expect(
        text.split(/(?=<)/).find((l) => id.test(l) && /http:\/\/localhost:5178\//.test(l)),
      ).toBeDefined();
  });
});
