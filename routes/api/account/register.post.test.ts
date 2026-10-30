// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  call,
  count,
  customers,
  loadApp,
} from "../../../tests/acceptance/customer-account/harness";

const register = (
  app: Awaited<ReturnType<typeof loadApp>>,
  userId: string,
  password: string,
  repeat = password,
) =>
  call(app, "../../../routes/api/account/register.post", {
    method: "POST",
    url: "/api/account/register",
    json: { userId, password, passwordRepeat: repeat },
  });
const signIn = (app: Awaited<ReturnType<typeof loadApp>>, userId: string, password: string) =>
  call(app, "../../../routes/api/session/sign-in.post", {
    method: "POST",
    url: "/api/session/sign-in",
    json: { userId, password, remember: false },
  });

describe("registration", () => {
  it("[SWHR2-C-0148] two different passwords proceed using the first, with no mismatch reported", async () => {
    const app = await loadApp();
    const r = await register(app, "newuser2", "first1", "second2");
    expect(r.status).toBeLessThan(300);
    expect(JSON.stringify(r.body)).not.toMatch(/match/i);
    expect((await signIn(app, "newuser2", "first1")).status).toBe(200);
    expect((await signIn(app, "newuser2", "second2")).status).toBe(401);
  });

  it("[SWHR2-C-0155] a new-user submission for newuser creates the sign-on account and goes onward", async () => {
    const app = await loadApp();
    const r = await register(app, "newuser", "secret1");
    expect(r.status).toBeLessThan(300);
    expect(JSON.stringify(r.body)).not.toContain("UserExists");
    expect(count(app.client, "signon_users", "user_id = 'newuser'")).toBe(1);
  });

  it("[SWHR2-C-0146] signing up as j2ee with the same password in both fields proceeds to account creation", async () => {
    const app = await loadApp();
    const r = await register(app, "j2ee", "secret1", "secret1");
    expect(r.status).toBeLessThan(300);
    expect(JSON.stringify(r.body)).not.toContain("UserExists");
    expect(count(app.client, "signon_users", "user_id = 'j2ee'")).toBe(1);
  });

  it("[SWHR2-C-0156] a new-user submission for existing j2ee creates nothing and is refused with UserExists", async () => {
    const { client, ...app } = await customers();
    await app.svc.registerUser("j2ee", "j2ee");
    const before = client
      .query("select password_hash h from signon_users where user_id = 'j2ee'")
      .get();
    const r = await register(app as never, "j2ee", "other");
    expect(r.status).toBe(409);
    expect(JSON.stringify(r.body)).toContain("UserExists");
    expect(count(client, "signon_users", "user_id = 'j2ee'")).toBe(1);
    expect(
      client.query("select password_hash h from signon_users where user_id = 'j2ee'").get(),
    ).toEqual(before);
  });
});
