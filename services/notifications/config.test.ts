import { afterEach, describe, expect, it } from "vitest";

import { mailConfig, notificationSwitches } from "./config";

const KEYS = [
  "NOTIFY_APPROVAL_ENABLED",
  "NOTIFY_SHIPMENT_ENABLED",
  "NOTIFY_COMPLETED_ENABLED",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USER",
  "MAIL_PASSWORD",
  "MAIL_FROM",
];
afterEach(() => KEYS.forEach((k) => delete process.env[k]));

describe("notification switches", () => {
  it("are all off by default", () => {
    expect(notificationSwitches()).toEqual({ approval: false, shipment: false, completed: false });
  });

  it("switch independently, case-insensitively, read on every call", () => {
    process.env.NOTIFY_SHIPMENT_ENABLED = "TRUE";
    expect(notificationSwitches()).toEqual({ approval: false, shipment: true, completed: false });
    process.env.NOTIFY_SHIPMENT_ENABLED = "false";
    expect(notificationSwitches().shipment).toBe(false);
  });

  it("throw on a value that is not a boolean", () => {
    process.env.NOTIFY_COMPLETED_ENABLED = "maybe";
    expect(() => notificationSwitches()).toThrow(/NOTIFY_COMPLETED_ENABLED/);
  });
});

describe("mail configuration", () => {
  it("[SWHR2-C-0052] ships customerservice@javapetstoredemo.com as the sender", () => {
    expect(mailConfig().from).toBe("customerservice@javapetstoredemo.com");
  });

  it("[SWHR2-C-0053] [SWHR2-C-0059] uses the operator's server, account and sender", () => {
    Object.assign(process.env, {
      MAIL_HOST: "smtp.example.com",
      MAIL_PORT: "2525",
      MAIL_USER: "petstore-mailer",
      MAIL_PASSWORD: "pw",
      MAIL_FROM: "orders@example.com",
    });
    expect(mailConfig()).toEqual({
      host: "smtp.example.com",
      port: 2525,
      auth: { user: "petstore-mailer", pass: "pw" },
      from: "orders@example.com",
    });
  });
});
