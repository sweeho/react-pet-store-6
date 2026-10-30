import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import StorefrontHeader from "./StorefrontHeader";

afterEach(() => vi.unstubAllGlobals());

async function header(session: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(session)),
  );
  render(
    <MemoryRouter>
      <StorefrontHeader />
    </MemoryRouter>,
  );
  await screen.findByText(/sign (in|out)/i);
}

function expectCommon() {
  expect(screen.getByRole("link", { name: /pet store/i })).toHaveAttribute("href", "/");
  expect(screen.getByRole("searchbox")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /^account$/i })).toHaveAttribute(
    "href",
    "/petstore/account",
  );
  expect(screen.getByRole("link", { name: /^cart$/i })).toHaveAttribute("href", "/petstore/cart");
}

describe("StorefrontHeader", () => {
  it("[SWHR2-C-0265] a visitor who is not signed in sees Sign in and no Sign out", async () => {
    await header({ locale: "en_US", signedOn: false });
    expectCommon();
    expect(screen.getByText(/^sign in$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^sign out$/i)).not.toBeInTheDocument();
  });

  it("[SWHR2-C-0266] a signed-in customer sees Sign out and no Sign in", async () => {
    await header({ locale: "en_US", signedOn: true, userId: "j2ee" });
    expectCommon();
    expect(screen.getByText(/^sign out$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^sign in$/i)).not.toBeInTheDocument();
  });
});
