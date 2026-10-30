import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import CartPage from "./cart";

afterEach(() => vi.unstubAllGlobals());

function renderCart(view: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(view)),
  );
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>,
  );
}

describe("cart screen", () => {
  it("[SWHR2-C-0086] shows the linked name, Remove, quantity, price, Update Cart, total and Check Out", async () => {
    renderCart({
      locale: "en_US",
      total: 3300,
      lines: [
        {
          itemId: "EST-1",
          name: "Large Angelfish",
          productName: "Angelfish",
          attribute: "Spotted",
          quantity: 2,
          unitPrice: 1650,
          lineTotal: 3300,
        },
      ],
    });
    const link = await screen.findByRole("link", { name: /Large Angelfish/ });
    expect(link.getAttribute("href")).toContain("item/EST-1");
    const row = link.closest("tr") as HTMLElement;
    expect(within(row).getByRole("button", { name: /remove/i })).toBeInTheDocument();
    expect(within(row).getByDisplayValue("2")).toBeInTheDocument();
    expect(within(row).getByText("$16.50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update cart/i })).toBeInTheDocument();
    expect(screen.getByText("$33.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /check ?out/i })).toBeInTheDocument();
  });

  it("[SWHR2-C-0087] an empty cart shows only the empty message", async () => {
    renderCart({ locale: "en_US", total: 0, lines: [] });
    expect(await screen.findByText("Your Shopping Cart is Empty.")).toBeInTheDocument();
    expect(screen.queryByRole("row")).toBeNull();
    expect(screen.queryByRole("button", { name: /update cart/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /check ?out/i })).toBeNull();
    expect(screen.queryByText(/\$\d/)).toBeNull();
  });
});
