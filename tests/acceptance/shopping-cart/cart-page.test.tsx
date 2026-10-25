import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import CartPage from "../../../src/pages/petstore/cart";

afterEach(() => vi.unstubAllGlobals());

async function cartScreen(view: object) {
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
  // case: SWHR2-C-0086@v1
  it("SWHR2-C-0086: a cart with 2 x Large Angelfish shows the linked name, Remove, quantity, price, Update Cart, total and Check Out", async () => {
    await cartScreen({
      locale: "en_US",
      total: 3300,
      lines: [
        {
          itemId: "EST-1",
          name: "Large Angelfish",
          productName: "Angelfish",
          quantity: 2,
          unitPrice: 1650,
          lineTotal: 3300,
        },
      ],
    });
    const link = await screen.findByRole("link", { name: /Large Angelfish/ });
    expect(link.getAttribute("href")).toContain("item/EST-1");
    expect(screen.getByRole("button", { name: /remove/i }).tagName).toBeDefined();
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    expect(screen.getAllByText(/\$16\.50/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /update cart/i })).toBeInTheDocument();
    expect(screen.getByText(/\$33\.00/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /check ?out/i })).toBeInTheDocument();
  });

  // case: SWHR2-C-0087@v1
  it("SWHR2-C-0087: an empty cart shows only 'Your Shopping Cart is Empty.'", async () => {
    await cartScreen({ locale: "en_US", total: 0, lines: [] });
    expect(await screen.findByText("Your Shopping Cart is Empty.")).toBeInTheDocument();
    expect(screen.queryByRole("row")).toBeNull();
    expect(screen.queryByRole("button", { name: /update cart/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /check ?out/i })).toBeNull();
    expect(screen.queryByText(/\$\d/)).toBeNull();
  });
});
