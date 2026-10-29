import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import CategoryPage from "./[categoryId]";

afterEach(() => vi.unstubAllGlobals());

const products = [
  { productId: "K-1", categoryId: "DOGS", name: "Bulldog", description: "From England", image: "" },
  { productId: "K-2", categoryId: "DOGS", name: "Dalmation", description: "Spotted", image: "" },
  { productId: "K-3", categoryId: "DOGS", name: "Poodle", description: "From France", image: "" },
];

function stubCatalog() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const u = new URL(url, "http://x");
      if (u.pathname.endsWith("/products")) {
        const start = Number(u.searchParams.get("start") ?? 0);
        const items = products.slice(start, start + 2);
        return Response.json({
          items,
          start,
          size: 2,
          hasPrevious: start > 0,
          hasNext: start + 2 < products.length,
          previousStart: Math.max(start - 2, 0),
          nextStart: start + items.length,
        });
      }
      return Response.json({ categoryId: "DOGS", name: "Dogs", description: "", image: "" });
    }),
  );
}

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [{ path: "/petstore/category/:categoryId", element: <CategoryPage /> }],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
};

describe("category page", () => {
  it("first page shows two products and Next only", async () => {
    stubCatalog();
    renderAt("/petstore/category/DOGS");
    expect(await screen.findByText("Bulldog")).toBeInTheDocument();
    expect(screen.getByText("Dalmation")).toBeInTheDocument();
    expect(screen.queryByText("Poodle")).toBeNull();
    expect(screen.getByRole("link", { name: /next/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /previous/i })).toBeNull();
  });

  it("Next shows the last product with Previous and no Next", async () => {
    stubCatalog();
    renderAt("/petstore/category/DOGS");
    await userEvent.click(await screen.findByRole("link", { name: /next/i }));
    expect(await screen.findByText("Poodle")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /previous/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /next/i })).toBeNull();
  });

  it("links each product to its item list", async () => {
    stubCatalog();
    renderAt("/petstore/category/DOGS");
    const link = await screen.findByRole("link", { name: /bulldog/i });
    expect(link.getAttribute("href")).toBe("/petstore/product/K-1");
  });
});
