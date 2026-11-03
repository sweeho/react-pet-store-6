import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "./LocaleProvider";
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

describe("StorefrontHeader language flags", () => {
  async function withProvider(path: string) {
    let locale = "en_US";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          locale = (JSON.parse(String(init.body)) as { locale: string }).locale;
          return Response.json({ locale });
        }
        return Response.json({ locale, signedOn: false });
      }),
    );
    render(
      <LocaleProvider>
        <MemoryRouter initialEntries={[path]}>
          <StorefrontHeader />
        </MemoryRouter>
      </LocaleProvider>,
    );
    await screen.findByText(/^sign in$/i);
  }

  it("[SWHR2-C-0299] [SWHR2-C-0300] activating the Japanese flag relabels the header in place", async () => {
    const user = userEvent.setup();
    await withProvider("/petstore/category/FISH");
    await user.click(screen.getByRole("button", { name: "Japanese" }));
    await waitFor(() => {
      const text = document.body.textContent ?? "";
      expect(text).toMatch(/[぀-ヿ]/);
      expect(text).not.toMatch(/Sign in/);
    });
  });

  it("shows no language flags in the staff areas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ locale: "en_US", signedOn: false })),
    );
    render(
      <LocaleProvider>
        <MemoryRouter initialEntries={["/admin"]}>
          <StorefrontHeader />
        </MemoryRouter>
      </LocaleProvider>,
    );
    await screen.findByRole("link", { name: /^cart$/i });
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});
