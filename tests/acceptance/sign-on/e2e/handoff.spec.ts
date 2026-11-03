import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

// The running server's database file (db/client.ts resolves it from the project root).
const DB_FILE = path.join(process.cwd(), "sqlite.db");

/**
 * Runs `script` against the server's database in a bun child process (Playwright runs this file
 * under Node, where bun:sqlite does not exist) and returns what it writes to stdout.
 */
function inDb(script: string, args: unknown[]): string {
  const prelude = `
    const { Database } = require("bun:sqlite");
    const [file, ...args] = JSON.parse(process.argv[1]);
    const db = new Database(file);
    db.exec("PRAGMA busy_timeout = 10000");`;
  return execFileSync("bun", ["-e", prelude + script, JSON.stringify([DB_FILE, ...args])], {
    encoding: "utf8",
  });
}

/**
 * A spy on the hand-off service's queue (its messages table, as in SWHR2-C-0263): a trigger copies
 * every message the service queues into a spy table of this run's own.
 */
function installSpy(spy: string) {
  inDb(
    `const [spy] = args;
     db.exec("create table " + spy + " as select * from messages where 0");
     db.exec("create trigger " + spy + "_copy after insert on messages begin insert into " + spy + " select * from messages where rowid = new.rowid; end");`,
    [spy],
  );
}
/** Every message the spy saw, as one JSON text per row. */
function spied(spy: string): string[] {
  return JSON.parse(
    inDb(
      `const [spy] = args;
       process.stdout.write(JSON.stringify(db.query("select * from " + spy).all().map((r) => JSON.stringify(r))));`,
      [spy],
    ),
  );
}
function removeSpy(spy: string) {
  inDb(
    `const [spy] = args;
     db.exec("drop trigger if exists " + spy + "_copy");
     db.exec("drop table if exists " + spy);`,
    [spy],
  );
}

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

/** The hand-off's channels. */
const CHANNELS = [
  "order.new",
  "order.approval",
  "supplier.purchase-order",
  "supplier.invoice",
  "supplier.inventory-changed",
  "mail.outbound",
];
/** The hand-off service's likely paths: its names (enqueue, outbox, legacy async sender) and channels. */
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
const LIKELY_PATHS = [
  ...HANDOFF_NAMES.map((n) => `/api/${n}`),
  ...HANDOFF_NAMES.map((n) => `/api/messaging/${n}`),
  ...CHANNELS.map((c) => `/api/messaging/${c}`),
  ...CHANNELS.map((c) => `/api/messages/${c}`),
  ...CHANNELS.map((c) => `/api/${c}`),
];
/**
 * A message in the hand-off's own input shape (a channel and a payload), carrying `marker` so a
 * queued copy of it can be traced back to the request that sent it.
 */
const message = (marker: string) => ({
  channel: "order.new",
  payload: `<PurchaseOrder><OrderId>${marker}</OrderId></PurchaseOrder>`,
  message: marker,
});

test.describe("sign-on: hand-off from outside", () => {
  // case: SWHR2-C-0264@v1
  test("SWHR2-C-0264: no public route reaches the hand-off service", async ({ request }) => {
    // one request per route pattern and per likely path and method, against a possibly cold server
    test.setTimeout(90_000);
    const run = `${process.pid}_${Date.now()}`;
    const spy = `spy_outside_${run}`;
    installSpy(spy);
    try {
      // Step 1: a caller outside the application sends HTTP requests to every route pattern
      // under routes/api, and to the hand-off's likely paths, each carrying a message in the
      // hand-off's input shape marked with the request that sent it.
      const routes = routePatterns();
      expect(routes.length).toBeGreaterThan(0);
      const routeUrls = new Set(routes.map((r) => r.url));
      const sent = new Map<string, string>();
      const unrouted: string[] = [];
      const send = async (method: string, url: string) => {
        const marker = `outside-probe-${run}-${sent.size}-end`;
        sent.set(marker, `${method} ${url}`);
        const r = await request.fetch(
          method === "GET" ? `${url}?${new URLSearchParams(message(marker))}` : url,
          {
            method,
            data: method === "GET" ? undefined : message(marker),
            failOnStatusCode: false,
          },
        );
        return r.status();
      };
      for (const { method, url } of routes) await send(method, url);
      for (const url of LIKELY_PATHS)
        for (const method of ["GET", "POST", "PUT"]) {
          const status = await send(method, url);
          // a likely path no route file serves answers 404, whatever the method
          if (!routeUrls.has(url) && status !== 404) unrouted.push(`${method} ${url} -> ${status}`);
        }
      // Step 2: check whether any of them reached the hand-off service: a request that reached it
      // has its marked message on the service's queue.
      const queued = spied(spy);
      const reached = [...sent]
        .filter(([marker]) => queued.some((m) => m.includes(marker)))
        .map(([, req]) => req);
      // Expected: no public route reaches the hand-off service, and its likely paths return 404.
      expect(reached, "requests from outside whose message reached the hand-off queue").toEqual([]);
      expect(unrouted, "likely hand-off paths that did not return 404").toEqual([]);
    } finally {
      removeSpy(spy);
    }
  });
});
