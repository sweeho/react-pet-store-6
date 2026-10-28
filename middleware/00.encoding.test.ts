import { H3Event } from "nitro/h3";
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import encoding from "./00.encoding";

/**
 * INTEGRATION TEST for middleware/00.encoding.ts in isolation: sign-on,
 * registration and search routes do not exist yet (design.md SD1), so the
 * "handlers" here are stand-ins that read the request the way a real one would.
 */
const urlencoded = (fields: Record<string, string>) =>
  new H3Event(
    new Request("http://localhost/api/x", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: Object.entries(fields)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&"),
    }),
  );

const readForm = async (event: H3Event, name: string) =>
  (await event.req.clone().formData()).get(name);

describe("00.encoding middleware", () => {
  it("[SWHR2-C-0031] sign-on receives a Chinese user name decoded as UTF-8", async () => {
    const event = urlencoded({ userId: "张伟", password: "pw-1234" });
    await encoding(event);
    expect(event.req.headers.get("content-type")).toContain("charset=utf-8");
    expect(await readForm(event, "userId")).toBe("张伟");
  });

  it("[SWHR2-C-0032] every handler of a request sees Japanese form values decoded as UTF-8", async () => {
    const event = urlencoded({ name: "山田太郎" });
    await encoding(event);
    const first = await readForm(event, "name");
    const second = await readForm(event, "name");
    expect(first).toBe("山田太郎");
    expect(second).toBe("山田太郎");
  });

  it("[SWHR2-C-0039] a Japanese name submitted in a form is read back unchanged", async () => {
    const event = urlencoded({ firstName: "太郎", lastName: "山田" });
    await encoding(event);
    expect(`${await readForm(event, "lastName")}${await readForm(event, "firstName")}`).toBe(
      "山田太郎",
    );
  });

  it("[SWHR2-C-0040] a Chinese keyword in a query parameter is read as the same characters", async () => {
    const event = new H3Event(
      new Request(`http://localhost/api/catalog/search?keyword=${encodeURIComponent("金鱼")}`),
    );
    await encoding(event);
    expect(new URL(event.req.url).searchParams.get("keyword")).toBe("金鱼");
    expect(event.url.searchParams.get("keyword")).toBe("金鱼");
  });

  it("[SWHR2-C-0031] leaves an explicit charset alone and declares utf-8 on text responses", async () => {
    const event = urlencoded({ a: "b" });
    const res = (await encoding(
      event,
      async () =>
        new Response("ok", {
          headers: { "content-type": "text/html" },
        }),
    )) as Response;
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });

  it("[SWHR2-C-0032] runs before the session middleware, so later handlers see decoded values", async () => {
    const order = readdirSync(__dirname)
      .sort()
      .filter((f) => /^\d+\..*\.ts$/.test(f) && !f.includes(".test."));
    expect(order.indexOf("00.encoding.ts")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("00.encoding.ts")).toBeLessThan(order.indexOf("10.session.ts"));
    const event = urlencoded({ name: "山田太郎" });
    await encoding(event);
    const session = (await import("./10.session")).default;
    await session(event);
    expect(await readForm(event, "name")).toBe("山田太郎");
  });
});
