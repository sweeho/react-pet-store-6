import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProductPage from "./[productId]";

afterEach(() => vi.unstubAllGlobals());

const item = (itemId: string, description: string) => ({
  itemId,
  productId: "FI-SW-01",
  name: "Angelfish",
  description,
  image: "i.jpg",
  attributes: [],
  listPrice: 1650,
  unitCost: 1000,
});

describe("product page", () => {
  it("lists one row per item with prices from hundredths and an Add to Cart button that posts the item id", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") return Response.json({ count: 1 });
      if (url.includes("/items"))
        return Response.json({
          items: [item("EST-1", "Large Angelfish"), item("EST-2", "Small Angelfish")],
          start: 0,
          size: 2,
          hasPrevious: false,
          hasNext: false,
        });
      return Response.json({
        productId: "FI-SW-01",
        categoryId: "FISH",
        name: "Angelfish",
        description: "Salt water fish",
        image: "",
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const router = createMemoryRouter(
      [{ path: "/petstore/product/:productId", element: <ProductPage /> }],
      { initialEntries: ["/petstore/product/FI-SW-01"] },
    );
    render(<RouterProvider router={router} />);

    const row = (await screen.findByText("Large Angelfish")).closest("tr")!;
    expect(within(row).getByText("EST-1")).toBeInTheDocument();
    expect(within(row).getByText(/16\.50/)).toBeInTheDocument();
    expect(within(row).getByText(/10\.00/)).toBeInTheDocument();
    await userEvent.click(within(row).getByRole("button", { name: /add to cart/i }));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post?.[0]).toBe("/api/cart/items");
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ itemId: "EST-1" });
  });
});
