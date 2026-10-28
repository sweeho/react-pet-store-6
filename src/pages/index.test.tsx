import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AppShell from "@/components/shell/AppShell";
import { primaryAreas } from "@/components/shell/areas";

import Home from "./index";

describe("Landing page", () => {
  it("[SWHR2-C-0270] renders the welcome heading", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome to Pet Store" }),
    ).toBeInTheDocument();
  });

  it("links to every primary area exactly once", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    for (const area of primaryAreas) {
      expect(hrefs.filter((h) => h === area.href)).toHaveLength(1);
    }
  });

  it("the shell navigation links every primary area and Home", () => {
    render(
      <MemoryRouter>
        <AppShell>
          <Home />
        </AppShell>
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Global" });
    for (const area of primaryAreas) {
      expect(within(nav).getByRole("link", { name: new RegExp(area.name) })).toHaveAttribute(
        "href",
        area.href,
      );
    }
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { level: 1 }));
  });
});
