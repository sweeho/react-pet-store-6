// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { deliver, loadOrders, statusOf } from "../../tests/acceptance/order-approval/harness";

describe("automatic approval on receipt", () => {
  const cases: [string, string, string, number, string][] = [
    ["SWHR2-C-0228", "1001", "en_US", 499.99, "APPROVED"],
    ["SWHR2-C-0229", "1002", "en_US", 500, "PENDING"],
    ["SWHR2-C-0230", "1003", "en_US", 612.5, "PENDING"],
    ["SWHR2-C-0231", "1004", "ja_JP", 49999, "APPROVED"],
    ["SWHR2-C-0232", "1005", "ja_JP", 50000, "PENDING"],
    ["SWHR2-C-0233", "1006", "zh_CN", 10, "PENDING"],
  ];
  it.each(cases)("[%s] order %s %s %s ends %s", async (_k, id, locale, total, expected) => {
    const { client } = await loadOrders();
    await deliver({ orderId: id, locale, total });
    expect(statusOf(client, id)).toBe(expected);
  });

  it("[SWHR2-C-0239] the order is PENDING when the rule is evaluated", async () => {
    vi.resetModules();
    const seen: (string | undefined)[] = [];
    const { db } = await import("../../db/client");
    const client = db.$client as unknown as import("bun:sqlite").Database;
    vi.doMock("./approval", async (orig) => {
      const real = await orig<typeof import("./approval")>();
      return {
        ...real,
        autoApproves: (...a: Parameters<typeof real.autoApproves>) => {
          seen.push(statusOf(client, "1007"));
          return real.autoApproves(...a);
        },
      };
    });
    await deliver({ orderId: "1007", locale: "en_US", total: 100 });
    expect(seen).toEqual(["PENDING"]);
    expect(statusOf(client, "1007")).toBe("APPROVED");
    vi.doUnmock("./approval");
  });
});
