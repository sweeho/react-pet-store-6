import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SearchPage from "./search";

afterEach(() => vi.unstubAllGlobals());

const renderAt = (path: string) => {
  const router = createMemoryRouter([{ path: "/petstore/search", element: <SearchPage /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
};

const envelope = (items: unknown[]) => ({
  items,
  start: 0,
  size: 10,
  hasPrevious: false,
  hasNext: false,
});

describe("search results page", () => {
  it("queries the search API with the q parameter and lists matches with Add to Cart", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () =>
      Response.json(
        envelope([
          {
            itemId: "EST-1",
            productId: "FI-SW-01",
            name: "Angelfish",
            description: "Large Angelfish",
            image: "",
            attributes: [],
            listPrice: 1650,
            unitCost: 1000,
            locale: "en_US",
          },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderAt("/petstore/search?q=angel%20koi");
    expect(await screen.findByText("Large Angelfish")).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("q=angel+koi");
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
    expect(screen.getByText(/10\.00/)).toBeInTheDocument();
  });

  it("shows the no-results message when nothing matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(envelope([]))),
    );
    renderAt("/petstore/search?q=zzz");
    expect(await screen.findByText(/no items match/i)).toBeInTheDocument();
  });
});
