import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import CategoryPanel from "./CategoryPanel";

afterEach(() => vi.unstubAllGlobals());

const page = (names: [string, string][]) => ({
  items: names.map(([categoryId, name]) => ({ categoryId, name, description: "", image: "" })),
  start: 0,
  size: 100,
  hasPrevious: false,
  hasNext: false,
});

describe("CategoryPanel", () => {
  it("[SWHR2-C-0201] [SWHR2-C-0202] lists the categories in API order as links to their category pages inside one complementary landmark", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () =>
      Response.json(
        page([
          ["BIRDS", "Birds"],
          ["FISH", "Fish"],
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <MemoryRouter>
        <CategoryPanel />
      </MemoryRouter>,
    );
    const panel = await screen.findByRole("complementary");
    const links = await within(panel).findAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["Birds", "Fish"]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/petstore/category/BIRDS",
      "/petstore/category/FISH",
    ]);
    // [SWHR2-C-0202] selecting an entry opens that category page
    expect(links[1]?.getAttribute("href")).toBe("/petstore/category/FISH");
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/^\/api\/catalog\/categories\?/);
  });

  it("shows an error with Try again when the catalog fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 500 })),
    );
    render(
      <MemoryRouter>
        <CategoryPanel />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
