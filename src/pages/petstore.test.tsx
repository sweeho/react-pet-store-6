import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Petstore from "./petstore";

afterEach(() => vi.unstubAllGlobals());

describe("storefront layout", () => {
  it("[SWHR2-C-0201] shows the category panel as the only complementary landmark beside the page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).startsWith("/api/session")
          ? Response.json({ locale: "en_US" })
          : Response.json({
              items: [
                { categoryId: "BIRDS", name: "Birds", description: "", image: "" },
                { categoryId: "CATS", name: "Cats", description: "", image: "" },
              ],
              start: 0,
              size: 100,
              hasPrevious: false,
              hasNext: false,
            }),
      ),
    );
    render(
      <MemoryRouter initialEntries={["/petstore/x"]}>
        <Routes>
          <Route path="/petstore" element={<Petstore />}>
            <Route path="x" element={<p>page marker</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("page marker")).toBeInTheDocument();
    const panel = await screen.findByRole("complementary");
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect((await within(panel).findAllByRole("link")).map((a) => a.textContent)).toEqual([
      "Birds",
      "Cats",
    ]);
  });
});
