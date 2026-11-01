import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AddToCart from "./AddToCart";

afterEach(() => vi.unstubAllGlobals());

function mount() {
  const router = createMemoryRouter(
    [
      {
        path: "/petstore/search",
        element: <AddToCart itemId="EST-2" />,
      },
      { path: "/petstore/cart", element: <p>cart screen</p> },
    ],
    { initialEntries: ["/petstore/search"] },
  );
  render(<RouterProvider router={router} />);
}

describe("AddToCart", () => {
  it("[SWHR2-C-0096] [SWHR2-C-0097] posts the item and opens the cart screen", async () => {
    const fetchMock = vi.fn(async () => Response.json({ locale: "en_US", lines: [], total: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    mount();
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(await screen.findByText("cart screen")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cart/items",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ itemId: "EST-2" }) }),
    );
  });

  it("stays on the page and reports a failed add", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 500 })),
    );
    mount();
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(screen.queryByText("cart screen")).toBeNull();
  });
});
