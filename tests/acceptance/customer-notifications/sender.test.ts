// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

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
  it("SWHR2-C-0065: Japanese HTML content is sent byte-for-byte unchanged on an English-default server", async () => {
    const saved = { LANG: process.env.LANG, LC_ALL: process.env.LC_ALL };
    try {
      // an English-default server whose platform charset is not UTF-8
      const a = await mailApp({ LANG: "en_US.ISO-8859-1", LC_ALL: "en_US.ISO-8859-1" });
      const html = "<html><body><p>ご注文ありがとうございます</p></body></html>";
      await a.send.sendMail({ to: "a@example.com", subject: "S", content: html });
      expect(a.raw).toHaveLength(1);
      // render the message the app built into the bytes that go on the wire
      const real = await vi.importActual<{
        createTransport: (o: object) => {
          sendMail: (m: object) => Promise<{ message: Buffer }>;
        };
      }>("nodemailer");
      const { message } = await real
        .createTransport({ streamTransport: true, buffer: true })
        .sendMail(a.raw[0]);
      const part = htmlPart(message);
      expect(part.type).toBe("text/html");
      expect(new TextDecoder(part.charset).decode(part.body)).toBe(html);
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});

/** The text/html part of a raw RFC 822 message: its type, declared charset and decoded body bytes. */
function htmlPart(message: Buffer): { type: string; charset: string; body: Uint8Array } {
  const lines = message.toString("latin1").split("\r\n");
  for (let i = 0; i < lines.length; i++) {
    // collect one header block (with folded continuation lines)
    const headers: string[] = [];
    let j = i;
    while (j < lines.length && lines[j] !== "") {
      if (/^[ \t]/.test(lines[j]) && headers.length) headers[headers.length - 1] += lines[j];
      else headers.push(lines[j]);
      j++;
    }
    const ct = headers.find((h) => /^content-type:\s*text\/html/i.test(h));
    if (!ct) continue;
    const cte = (headers.find((h) => /^content-transfer-encoding:/i.test(h)) ?? "")
      .replace(/^[^:]*:\s*/, "")
      .trim()
      .toLowerCase();
    const charset = /charset="?([^";\s]+)"?/i.exec(ct)?.[1] ?? "us-ascii";
    const bodyLines: string[] = [];
    for (let k = j + 1; k < lines.length && !lines[k].startsWith("--"); k++)
      bodyLines.push(lines[k]);
    while (bodyLines.length && bodyLines[bodyLines.length - 1] === "") bodyLines.pop();
    let body: Buffer;
    if (cte === "base64") body = Buffer.from(bodyLines.join(""), "base64");
    else if (cte === "quoted-printable") {
      const qp = bodyLines.map((l) => (l.endsWith("=") ? l.slice(0, -1) : l + "\r\n")).join("");
      body = Buffer.from(
        qp
          .replace(/\r\n$/, "")
          .replace(/=([0-9A-F]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16))),
        "latin1",
      );
    } else body = Buffer.from(bodyLines.join("\r\n"), "latin1");
    return { type: "text/html", charset, body };
  }
  throw new Error("no text/html part in the sent message");
}
