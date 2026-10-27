import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import AppShell from "./AppShell";

describe("AppShell", () => {
  it("[SWHR2-C-0275] renders page content in main, between the header and nav and the footer", () => {
    render(
      <MemoryRouter initialEntries={["/test"]}>
        <AppShell headerSlot={<span>slot marker</span>}>
          <p>page marker</p>
        </AppShell>
      </MemoryRouter>,
    );

    const header = screen.getByRole("banner");
    const nav = screen.getByRole("navigation", { name: "Global" });
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");

    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);

    expect(within(main).getByText("page marker")).toBeInTheDocument();
    expect(within(header).getByText("slot marker")).toBeInTheDocument();
    expect(
      within(nav)
        .getAllByRole("link")
        .some((a) => a.getAttribute("href") === "/"),
    ).toBe(true);

    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(header, nav)).toBe(true);
    expect(follows(nav, main)).toBe(true);
    expect(follows(main, footer)).toBe(true);
  });
});
