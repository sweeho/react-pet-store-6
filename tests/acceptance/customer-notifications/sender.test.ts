// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { mailApp, resetEnv } from "./harness";

afterEach(resetEnv);

describe("mail sender", () => {
  // case: SWHR2-C-0050@v1
  it("SWHR2-C-0050: recipient 'a@example.com, b@example.com' sends to both addresses as To recipients", async () => {
    const a = await mailApp();
    await a.send.sendMail({ to: "a@example.com, b@example.com", subject: "S", content: "C" });
    expect(a.outbox).toHaveLength(1);
    expect(a.outbox[0].to).toEqual(["a@example.com", "b@example.com"]);
    expect(a.outbox[0].cc).toEqual([]);
    expect(a.outbox[0].bcc).toEqual([]);
  });

  // case: SWHR2-C-0051@v1
  it("SWHR2-C-0051: a single recipient is sent as the sole To recipient", async () => {
    const a = await mailApp();
    await a.send.sendMail({ to: "a@example.com", subject: "S", content: "C" });
    expect(a.outbox[0].to).toEqual(["a@example.com"]);
    expect(a.outbox[0].cc).toEqual([]);
    expect(a.outbox[0].bcc).toEqual([]);
  });

  // case: SWHR2-C-0052@v1
  it("SWHR2-C-0052: the shipped mail configuration sends from customerservice@javapetstoredemo.com", async () => {
    const a = await mailApp();
    await a.send.sendMail({ to: "a@example.com", subject: "S", content: "C" });
    expect(a.outbox[0].from).toBe("customerservice@javapetstoredemo.com");
  });

  // case: SWHR2-C-0053@v1
  it("SWHR2-C-0053: the operator-set mail host and sender are used", async () => {
    const a = await mailApp({ MAIL_HOST: "smtp.example.com", MAIL_FROM: "orders@example.com" });
    await a.send.sendMail({ to: "a@example.com", subject: "S", content: "C" });
    expect(a.created.at(-1)?.host).toBe("smtp.example.com");
    expect(a.outbox[0].from).toBe("orders@example.com");
  });

  // case: SWHR2-C-0059@v1
  it("SWHR2-C-0059: the operator-set mail server, account name and sender are used to send", async () => {
    const a = await mailApp({
      MAIL_HOST: "smtp.example.com",
      MAIL_USER: "petstore-mailer",
      MAIL_PASSWORD: "pw",
      MAIL_FROM: "orders@example.com",
    });
    await a.send.sendMail({ to: "a@example.com", subject: "S", content: "C" });
    expect(a.created.at(-1)?.host).toBe("smtp.example.com");
    expect(a.created.at(-1)?.auth?.user).toBe("petstore-mailer");
    expect(a.outbox[0].from).toBe("orders@example.com");
  });

  // case: SWHR2-C-0063@v1
  it("SWHR2-C-0063: an e-mail request with recipient, subject and content is accepted", async () => {
    const a = await mailApp();
    await expect(
      Promise.resolve(a.send.sendMail({ to: "a@example.com", subject: "Hello", content: "Body" })),
    ).resolves.not.toThrow();
    expect(a.outbox).toHaveLength(1);
  });

  // case: SWHR2-C-0064@v1
  it("SWHR2-C-0064: an e-mail request without a subject is rejected and nothing is sent", async () => {
    const a = await mailApp();
    await expect(
      Promise.resolve().then(() => a.send.sendMail({ to: "a@example.com", content: "Body" })),
    ).rejects.toThrow(/subject/i);
    expect(a.outbox).toEqual([]);
  });

  // case: SWHR2-C-0065@v1
  it("SWHR2-C-0065: Japanese HTML content is sent unchanged on an English-default server", async () => {
    const a = await mailApp();
    const html = "<html><body><p>ご注文ありがとうございます</p></body></html>";
    await a.send.sendMail({ to: "a@example.com", subject: "S", content: html });
    expect(a.outbox[0].html).toBe(html);
  });
});
