import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import ItemPage from "../../../src/pages/petstore/item/[itemId]";

afterEach(() => vi.unstubAllGlobals());

describe("item detail page", () => {
  // case: SWHR2-C-0199@v1
  it("SWHR2-C-0199: EST-1 shows the image, List Price 16.50, Your Price 10.00 and Add to Cart", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          itemId: "EST-1",
          productId: "FI-SW-01",
          name: "Angelfish",
          description: "Large Angelfish",
          image: "/images/fish1.jpg",
          listPrice: 1650,
          unitCost: 1000,
        }),
      ),
    );
    const router = createMemoryRouter([{ path: "/petstore/item/:itemId", element: <ItemPage /> }], {
      initialEntries: ["/petstore/item/EST-1"],
    });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText(/List Price/i)).toBeInTheDocument();
    expect(screen.getByText(/16\.50/)).toBeInTheDocument();
    expect(screen.getByText(/Your Price/i)).toBeInTheDocument();
    expect(screen.getByText(/10\.00/)).toBeInTheDocument();
    // the item's own image, not just any image on the page
    expect(screen.getAllByRole("img").map((img) => img.getAttribute("src"))).toContain(
      "/images/fish1.jpg",
    );
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });
});
