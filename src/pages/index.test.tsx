import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { primaryAreas } from "@/components/shell/areas";

import Home from "./index";

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );

describe("Landing page", () => {
  it("renders the welcome heading inside the shell", () => {
    renderHome();
    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome to Pet Store" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("links to every primary area from the page and the global navigation", () => {
    renderHome();
    const main = screen.getByRole("main");
    const nav = screen.getByRole("navigation", { name: "Global" });
    for (const area of primaryAreas) {
      expect(within(main).getByRole("link", { name: new RegExp(area.name) })).toHaveAttribute(
        "href",
        area.href,
      );
      expect(within(nav).getByRole("link", { name: new RegExp(area.name) })).toHaveAttribute(
        "href",
        area.href,
      );
    }
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });
});
