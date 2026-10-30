import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import ItemPage from "./[itemId]";

afterEach(() => vi.unstubAllGlobals());

function renderItem() {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async (_url, init) =>
      init?.method === "POST"
        ? Response.json({ count: 1 })
        : Response.json({
            itemId: "EST-1",
            productId: "FI-SW-01",
            name: "Angelfish",
            description: "Large Angelfish",
            image: "/images/fish1.jpg",
            listPrice: 1650,
            unitCost: 1000,
          }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(
    [
      { path: "/petstore/item/:itemId", element: <ItemPage /> },
      { path: "/petstore/cart", element: <p>cart screen</p> },
    ],
    {
      initialEntries: ["/petstore/item/EST-1"],
    },
  );
  render(<RouterProvider router={router} />);
  return fetchMock;
}

describe("item detail page", () => {
  it("[SWHR2-C-0199] shows the image, List Price 16.50, Your Price 10.00 and Add to Cart", async () => {
    renderItem();
    expect(await screen.findByText("List Price")).toBeInTheDocument();
    expect(screen.getByText("$16.50")).toBeInTheDocument();
    expect(screen.getByText("Your Price")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Large Angelfish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("[SWHR2-C-0200] Add to Cart posts EST-1 to the cart API and opens the cart", async () => {
    const fetchMock = renderItem();
    await userEvent.click(await screen.findByRole("button", { name: /add to cart/i }));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post?.[0]).toBe("/api/cart/items");
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ itemId: "EST-1" });
    expect(await screen.findByText("cart screen")).toBeInTheDocument();
  });
});
