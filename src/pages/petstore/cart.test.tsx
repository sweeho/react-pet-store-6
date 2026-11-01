import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import CartPage from "./cart";

afterEach(() => vi.unstubAllGlobals());

const line = (id: string, name: string, quantity: number) => ({
  itemId: id,
  name,
  productName: "Angelfish",
  attribute: "",
  quantity,
  unitPrice: 1650,
  lineTotal: 1650 * quantity,
});
const view = (lines: ReturnType<typeof line>[]) => ({
  locale: "en_US",
  lines,
  total: lines.reduce((n, l) => n + l.lineTotal, 0),
});

function mount(responses: object[]) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () =>
    Response.json(responses.length > 1 ? responses.shift() : responses[0]),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>,
  );
  return fetchMock;
}

describe("cart page", () => {
  it("[SWHR2-C-0086] Check Out links to the checkout page", async () => {
    mount([view([line("EST-1", "Large Angelfish", 2)])]);
    const link = await screen.findByRole("link", { name: /check ?out/i });
    expect(link.getAttribute("href")).toBe("/petstore/checkout");
  });

  it("[SWHR2-C-0088] Remove calls DELETE and redisplays the returned lines", async () => {
    const fetchMock = mount([
      view([line("EST-1", "Large Angelfish", 1), line("EST-2", "Small Angelfish", 1)]),
      view([line("EST-2", "Small Angelfish", 1)]),
    ]);
    fireEvent.click(await screen.findByRole("button", { name: /remove large angelfish/i }));
    await waitFor(() => expect(screen.queryByText("Large Angelfish")).toBeNull());
    expect(screen.getByText("Small Angelfish")).toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === "DELETE");
    expect(call?.[0]).toBe("/api/cart/items/EST-1");
  });

  it("[SWHR2-C-0086] Update Cart sends the edited quantities with PUT", async () => {
    const fetchMock = mount([
      view([line("EST-1", "Large Angelfish", 1)]),
      view([line("EST-1", "Large Angelfish", 4)]),
    ]);
    fireEvent.change(await screen.findByDisplayValue("1"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /update cart/i }));
    await screen.findByDisplayValue("4");
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ quantities: { "EST-1": 4 } });
  });

  it("[SWHR2-C-0087] an emptied cart shows only the empty message", async () => {
    mount([view([line("EST-1", "Large Angelfish", 1)]), view([])]);
    fireEvent.click(await screen.findByRole("button", { name: /remove/i }));
    expect(await screen.findByText("Your Shopping Cart is Empty.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /update cart/i })).toBeNull();
  });
});
