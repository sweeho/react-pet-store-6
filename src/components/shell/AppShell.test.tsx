import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AppShell from "./AppShell";

describe("AppShell", () => {
  it("[SWHR2-C-0275] renders banner, navigation, main and contentinfo in order with children in main", () => {
    render(
      <MemoryRouter>
        <AppShell header={<span>header slot</span>}>
          <p>page marker</p>
        </AppShell>
      </MemoryRouter>,
    );
    const banner = screen.getByRole("banner");
    const nav = screen.getByRole("navigation", { name: "Global" });
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");
    expect(within(banner).getByText("header slot")).toBeInTheDocument();
    expect(within(main).getByText("page marker")).toBeInTheDocument();
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(banner, nav)).toBe(true);
    expect(follows(nav, main)).toBe(true);
    expect(follows(main, footer)).toBe(true);
  });
});
