import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import session from "../../../middleware/10.session";
import getSession from "./index.get";
import postLocale from "./locale.post";

async function start() {
  const event = new H3Event(new Request("http://localhost/api/session"));
  await session(event);
  return event;
}

function post(cookie: string, body: unknown) {
  return new H3Event(
    new Request("http://localhost/api/session/locale", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
    }),
  );
}

describe("session locale API", () => {
  it("a new session starts at en_US", async () => {
    const event = await start();
    expect(await getSession(event)).toEqual({ locale: "en_US" });
  });

  it("POST /api/session/locale sets the session locale that GET returns", async () => {
    const first = await start();
    const { id } = first.context.session as { id: string };
    const event = post(`sid=${id}`, { locale: "ja_JP" });
    await session(event);
    expect(await postLocale(event)).toEqual({ locale: "ja_JP" });
    const next = new H3Event(
      new Request("http://localhost/api/session", { headers: { cookie: `sid=${id}` } }),
    );
    await session(next);
    expect(await getSession(next)).toEqual({ locale: "ja_JP" });
  });

  it("rejects a code without an underscore with 400", async () => {
    const event = post("sid=none", { locale: "en" });
    await session(event);
    await expect(postLocale(event)).rejects.toMatchObject({ status: 400 });
  });
});
