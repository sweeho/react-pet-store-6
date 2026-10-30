import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import AddToCart from "./AddToCart";

afterEach(() => vi.unstubAllGlobals());

async function addFrom(itemId: string) {
  const fetchMock = vi.fn(async () => Response.json({ locale: "en_US", total: 0, lines: [] }));
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={["/petstore/page"]}>
      <Routes>
        <Route path="/petstore/page" element={<AddToCart itemId={itemId} />} />
        <Route path="/petstore/cart" element={<p>cart screen</p>} />
        <Route path="/petstore/signin" element={<p>sign on</p>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
  await waitFor(() => expect(screen.getByText(/cart screen|sign on/)).toBeInTheDocument());
  return fetchMock;
}

describe("Add to Cart", () => {
  it("[SWHR2-C-0093] an anonymous visitor adding EST-1 lands on the cart, not sign-on", async () => {
    await addFrom("EST-1");
    expect(screen.getByText("cart screen")).toBeInTheDocument();
  });

  it("[SWHR2-C-0096] adding from the product listing posts EST-1 with no quantity", async () => {
    const fetchMock = await addFrom("EST-1");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/cart/items");
    expect(JSON.parse(String(init.body))).toEqual({ itemId: "EST-1" });
    expect(screen.getByText("cart screen")).toBeInTheDocument();
  });

  it("[SWHR2-C-0097] adding from a search result posts EST-2 and opens the cart", async () => {
    const fetchMock = await addFrom("EST-2");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ itemId: "EST-2" });
    expect(screen.getByText("cart screen")).toBeInTheDocument();
  });
});
