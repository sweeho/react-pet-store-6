import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/components/storefront/LocaleProvider";

import GlobalNav from "./GlobalNav";

const areas = [
  { label: "Catalog & search", to: "/petstore" },
  { label: "Shopping cart", to: "/petstore/cart" },
  { label: "Language", to: "/petstore/change-language" },
  { label: "Sign in", to: "/petstore/signin" },
  { label: "Account & profile", to: "/petstore/account" },
  { label: "Order approval", to: "/admin" },
  { label: "Orders and sales", to: "/admin/tool" },
  { label: "Supplier inventory", to: "/supplier" },
];

describe("GlobalNav", () => {
  it("[SWHR2-C-0274] the home link returns to the landing page", async () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <GlobalNav />
        <Routes>
          <Route path="/" element={<h1>Landing</h1>} />
          <Route path="/about" element={<h1>About</h1>} />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Landing" })).toBeInTheDocument();
  });

  it("[SWHR2-C-0273] renders a navigation landmark with a home link", () => {
    render(
      <MemoryRouter>
        <GlobalNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Global" });
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("[SWHR2-C-0273] renders one link per area, grouped under four headings", () => {
    render(
      <MemoryRouter>
        <GlobalNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Global" });
    for (const area of areas) {
      expect(within(nav).getByRole("link", { name: area.label })).toHaveAttribute("href", area.to);
    }
    for (const group of ["Shop", "Account", "Administration", "Supplier"]) {
      expect(within(nav).getByRole("heading", { name: group })).toBeInTheDocument();
    }
  });

  it("has no link named like the cart's Check Out link", () => {
    render(
      <MemoryRouter>
        <GlobalNav />
      </MemoryRouter>,
    );
    expect(screen.queryAllByRole("link", { name: /check ?out/i })).toEqual([]);
  });

  it("[SWHR2-C-0283] the Shop group lists exactly Catalog & search, Shopping cart and Language", () => {
    render(
      <MemoryRouter>
        <GlobalNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Global" });
    const group = within(nav).getByRole("heading", { name: "Shop" }).parentElement as HTMLElement;
    expect(
      within(group)
        .getAllByRole("link")
        .map((l) => l.textContent),
    ).toEqual(["Catalog & search", "Shopping cart", "Language"]);
    expect(within(nav).queryByRole("link", { name: "Place order" })).toBeNull();
  });

  it("[SWHR2-C-0285] every area link has a different destination", () => {
    render(
      <MemoryRouter>
        <GlobalNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Global" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .filter((l) => l.textContent !== "Home")
      .map((l) => l.getAttribute("href"));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("[SWHR2-C-0286] on /petstore/cart only Shopping cart is the current page", () => {
    render(
      <MemoryRouter initialEntries={["/petstore/cart"]}>
        <GlobalNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Global" });
    const current = within(nav)
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(current.map((l) => l.textContent)).toEqual(["Shopping cart"]);
  });

  it("[SWHR2-C-0284] the storefront menu shows no Place order entry under Shop", () => {
    render(
      <MemoryRouter initialEntries={["/petstore"]}>
        <GlobalNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Global" });
    expect(within(nav).getByRole("link", { name: "Shopping cart" })).toBeInTheDocument();
    expect(within(nav).queryAllByRole("link", { name: /place order/i })).toEqual([]);
  });

  it("[SWHR2-C-0287] clicking Shopping cart highlights only the Shopping cart entry", async () => {
    render(
      <MemoryRouter initialEntries={["/petstore"]}>
        <GlobalNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Global" });
    await userEvent.click(within(nav).getByRole("link", { name: "Shopping cart" }));
    const current = within(nav)
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(current.map((l) => l.textContent)).toEqual(["Shopping cart"]);
  });
});

describe("GlobalNav locale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "ps_locale=; path=/; max-age=0";
  });

  function renderIn(locale: string) {
    document.cookie = `ps_locale=${locale}; path=/`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ locale })),
    );
    return render(
      <LocaleProvider>
        <MemoryRouter>
          <GlobalNav />
        </MemoryRouter>
      </LocaleProvider>,
    );
  }

  it("[SWHR2-C-0296] in ja_JP the navigation renders Japanese labels and no English Sign in", () => {
    renderIn("ja_JP");
    const text = screen.getByRole("navigation").textContent ?? "";
    expect(text).toMatch(/[぀-ヿ]/);
    expect(text).not.toMatch(/Sign in|Home|Shop|Account|Language/);
  });

  it("[SWHR2-C-0297] in en_US the navigation keeps its English labels", () => {
    renderIn("en_US");
    for (const { label, to } of areas) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", to);
    }
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });
});
