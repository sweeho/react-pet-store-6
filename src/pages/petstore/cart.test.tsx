import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("[SWHR2-C-0088] Remove on the EST-1 row redisplays the cart showing only EST-2", async () => {
    const line = (itemId: string, name: string) => ({
      itemId,
      name,
      productName: "Angelfish",
      attribute: "",
      quantity: 1,
      unitPrice: 1650,
      lineTotal: 1650,
    });
    const both = {
      locale: "en_US",
      total: 3300,
      lines: [line("EST-1", "Large"), line("EST-2", "Small")],
    };
    const only2 = { locale: "en_US", total: 1650, lines: [line("EST-2", "Small")] };
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      Response.json(init?.method === "DELETE" ? only2 : both),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    );
    const row = (await screen.findByRole("link", { name: /Large/ })).closest("tr") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: /remove/i }));
    await waitFor(() => expect(screen.queryByText("EST-1")).toBeNull());
    expect(screen.getByText("EST-2")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([u, i]) => String(u).endsWith("/EST-1") && i?.method === "DELETE"),
    ).toBe(true);
  });
});
