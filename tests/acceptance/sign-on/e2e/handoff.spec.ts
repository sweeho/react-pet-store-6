import { readdirSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

/** Every route file under routes/api, as the method and URL a caller outside would request. */
function routePatterns(): { method: string; url: string }[] {
  const methods = ["get", "post", "put", "patch", "delete"];
  const out: { method: string; url: string }[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.ts$/.test(e.name) && !/\.test\./.test(e.name)) {
        const parts = path.relative("routes/api", p).replace(/\.ts$/, "").split(path.sep);
        const last = parts[parts.length - 1].split(".");
        const method = methods.includes(last[last.length - 1]) ? last.pop()! : "get";
        parts[parts.length - 1] = last.join(".");
        if (parts[parts.length - 1] === "index") parts.pop();
        const url = parts.map((seg) => seg.replace(/\[(?:\.\.\.)?[^\]]+\]/g, "x")).join("/");
        out.push({ method: method.toUpperCase(), url: `/api/${url}` });
      }
    }
  };
  walk(path.join(process.cwd(), "routes/api"));
  return out;
}

/** The hand-off service's names (the enqueue function, the outbox, the legacy async sender) and its channels. */
const HANDOFF_NAMES = [
  "messaging",
  "messages",
  "message",
  "enqueue",
  "hand-off",
  "handoff",
  "outbox",
  "queue",
  "async-sender",
  "asyncsender",
  "send-message",
  "sendAMessage",
  "order-queue",
  "OrderQueue",
];
const CHANNELS = [
  "order.new",
  "order.approval",
  "supplier.purchase-order",
  "supplier.invoice",
  "supplier.inventory-changed",
  "mail.outbound",
];
const LIKELY_PATHS = [
  ...HANDOFF_NAMES.map((n) => `/api/${n}`),
  ...HANDOFF_NAMES.map((n) => `/api/messaging/${n}`),
  ...CHANNELS.map((c) => `/api/messaging/${c}`),
  ...CHANNELS.map((c) => `/api/messages/${c}`),
  ...CHANNELS.map((c) => `/api/${c}`),
];
/** A message in the hand-off's own input shape: a channel and a payload. */
const MESSAGE = {
  channel: "order.new",
  payload: "<PurchaseOrder><OrderId>outside-probe</OrderId></PurchaseOrder>",
};

test.describe("sign-on: hand-off from outside", () => {
  // case: SWHR2-C-0264@v1
  test("SWHR2-C-0264: no public route reaches the hand-off service", async ({ request }) => {
    // one request per route pattern and per likely path and method, against a possibly cold server
    test.setTimeout(60_000);
    // Step 1: a caller outside the application sends HTTP requests to every route pattern
    // under routes/api, carrying a message in the hand-off's input shape.
    const routes = routePatterns();
    expect(routes.length).toBeGreaterThan(0);
    const answered: { url: string; status: number }[] = [];
    for (const { method, url } of routes) {
      const r = await request.fetch(url, {
        method,
        data: method === "GET" ? undefined : MESSAGE,
        failOnStatusCode: false,
      });
      answered.push({ url, status: r.status() });
    }
    // the running server routes these requests (so a 404 below means "no such route", not "no server")
    expect(answered.filter((a) => a.status !== 404).length).toBeGreaterThan(0);
    // Step 2: none of the public route patterns is the hand-off service.
    const named = new RegExp(
      `(^|/)(${[...HANDOFF_NAMES, ...CHANNELS].map((n) => n.replace(/[.-]/g, "\\$&")).join("|")})(/|$)`,
      "i",
    );
    expect(routes.map((r) => r.url).filter((u) => named.test(u))).toEqual([]);
    // Expected: a request to any of the hand-off's likely paths returns 404, whatever the method.
    const reached: string[] = [];
    for (const url of LIKELY_PATHS)
      for (const method of ["GET", "POST", "PUT"]) {
        const r = await request.fetch(url, {
          method,
          data: method === "GET" ? undefined : MESSAGE,
          failOnStatusCode: false,
        });
        if (r.status() !== 404) reached.push(`${method} ${url} -> ${r.status()}`);
      }
    expect(reached).toEqual([]);
  });
});
