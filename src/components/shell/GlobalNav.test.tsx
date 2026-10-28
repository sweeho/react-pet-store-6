import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { areas } from "./areas";
import GlobalNav from "./GlobalNav";

describe("GlobalNav", () => {
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
