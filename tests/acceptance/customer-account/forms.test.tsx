import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AccountPage from "../../../src/pages/petstore/account";
import CartPage from "../../../src/pages/petstore/cart";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(session: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(session)),
  );
}

describe("account form", () => {
  const session = { locale: "en_US", signedOn: true, userId: "j2ee", preferences: {} };

  // case: SWHR2-C-0149@v1
  it("SWHR2-C-0149: the card type choice offers exactly Java(TM) Card, Duke Express and Meow Card", async () => {
    stubFetch(session);
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>,
    );
    const select = await screen.findByLabelText(/card type/i);
    const options = within(select)
      .getAllByRole("option")
      .map((o) => o.textContent?.trim());
    expect(options).toEqual(["Java(TM) Card", "Duke Express", "Meow Card"]);
  });

  // case: SWHR2-C-0150@v1
  it("SWHR2-C-0150: the expiry year is a fixed list of choices with no free-text entry", async () => {
    stubFetch(session);
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>,
    );
    const year = await screen.findByLabelText(/(expir|year)/i);
    expect(year.tagName).toBe("SELECT");
    const years = within(year)
      .getAllByRole("option")
      .map((o) => o.textContent?.trim());
    expect(years.length).toBeGreaterThan(0);
    expect(years).not.toContain("1999");
    expect(screen.queryByRole("textbox", { name: /year/i })).toBeNull();
  });
});

describe("pet-tips banner", () => {
  // case: SWHR2-C-0161@v1
  it("SWHR2-C-0161: an unrecognised favourite category shows the dogs banner on the cart screen", async () => {
    const session = {
      locale: "en_US",
      signedOn: true,
      userId: "j2ee",
      preferences: { banner: true, myList: true, favouriteCategory: "UNKNOWN" },
    };
    const cart = {
      locale: "en_US",
      total: 1650,
      lines: [
        {
          itemId: "EST-1",
          name: "Large Angelfish",
          productName: "Angelfish",
          quantity: 1,
          unitPrice: 1650,
          lineTotal: 1650,
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        Response.json(
          String(input instanceof Request ? input.url : input).includes("/api/session")
            ? session
            : cart,
        ),
      ),
    );
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("link", { name: /Large Angelfish/ })).toBeInTheDocument();
    const banner = await screen.findByTestId("pet-tips-banner");
    expect(banner.getAttribute("data-category") ?? banner.textContent).toMatch(/dog/i);
  });
});
