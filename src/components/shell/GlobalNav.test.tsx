import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import GlobalNav from "./GlobalNav";

const areas = [
  { label: "Catalog & search", to: "/petstore" },
  { label: "Shopping cart", to: "/petstore/cart" },
  { label: "Checkout", to: "/petstore/cart" },
  { label: "Language", to: "/petstore/change-language" },
  { label: "Sign in", to: "/petstore/signin" },
  { label: "Account & profile", to: "/petstore/account" },
  { label: "Order approval", to: "/admin" },
  { label: "Sales reporting", to: "/admin" },
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
});
