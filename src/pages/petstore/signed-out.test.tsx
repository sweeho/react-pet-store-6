import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/components/storefront/LocaleProvider";

import SignedOut from "./signed-out";

afterEach(() => vi.unstubAllGlobals());

async function renderSignedOut(locale: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ locale, signedOn: false })),
  );
  render(
    <MemoryRouter>
      <LocaleProvider>
        <SignedOut />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe("signed-out screen", () => {
  it("[SWHR2-C-0269] shows 'You are signed out' with a link to sign in again", async () => {
    await renderSignedOut("en_US");
    expect(screen.getByRole("heading", { name: "You are signed out" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in again/i })).toHaveAttribute(
      "href",
      "/petstore/signin",
    );
  });

  it("[SWHR2-C-0269] is shown in Japanese when the session locale is ja_JP", async () => {
    await renderSignedOut("ja_JP");
    await waitFor(() => expect(screen.getByRole("heading")).toHaveTextContent(/[぀-ヿ一-鿿]/));
    expect(screen.getAllByRole("link", { name: /[぀-ヿ一-鿿]/ }).length).toBeGreaterThan(0);
  });
});
