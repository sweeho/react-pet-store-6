import { describe, expect, it } from "vitest";

import { parseRequest, parseTriple, splitRecipients } from "./request";

describe("e-mail request", () => {
  it("[SWHR2-C-0063] accepts a request with recipient, subject and content", () => {
    expect(parseRequest({ to: "a@example.com", subject: "Hello", content: "Body" })).toEqual({
      to: "a@example.com",
      subject: "Hello",
      content: "Body",
    });
  });

  it("[SWHR2-C-0064] rejects a request without a subject", () => {
    expect(() => parseRequest({ to: "a@example.com", content: "Body" })).toThrow(/subject/i);
    expect(() => parseRequest({ to: "a@example.com", subject: "", content: "Body" })).toThrow(
      /subject/i,
    );
  });

  it("parses the JSON triple and rejects a malformed one", () => {
    expect(parseTriple(JSON.stringify(["a@example.com", "S", "C"]))).toEqual({
      to: "a@example.com",
      subject: "S",
      content: "C",
    });
    expect(() => parseTriple("not json")).toThrow();
    expect(() => parseTriple(JSON.stringify(["a@example.com", "S"]))).toThrow();
  });

  it("[SWHR2-C-0050] splits a comma-separated list into To recipients", () => {
    expect(splitRecipients("a@example.com, b@example.com")).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("[SWHR2-C-0051] keeps a single recipient as the only To recipient", () => {
    expect(splitRecipients("a@example.com")).toEqual(["a@example.com"]);
    expect(splitRecipients(" a@example.com ,, ")).toEqual(["a@example.com"]);
  });
});
