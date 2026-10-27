import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { NAV_AREAS } from "@/constants/navigation";

import Home from "./index";

const AREA_HREFS = [
  "/petstore",
  "/petstore/cart",
  "/petstore/checkout",
  "/petstore/change-language",
  "/petstore/signin",
  "/petstore/account",
  "/admin",
  "/admin/tool",
  "/supplier",
];

describe("Landing page", () => {
  it("[SWHR2-C-0271] links to every primary area exactly once", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(NAV_AREAS.length).toBeGreaterThan(0);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toHaveLength(NAV_AREAS.length);
    for (const area of NAV_AREAS) {
      expect(hrefs.filter((h) => h === area.href)).toHaveLength(1);
    }
  });

  it("[SWHR2-C-0270] shows the landing heading at the root route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByText(/not found|404/i)).not.toBeInTheDocument();
  });

  it.each(AREA_HREFS)("[SWHR2-C-0272] %s has a page of its own", (href) => {
    const pages = Object.keys(import.meta.glob("./**/*.tsx", { eager: false }));
    const file = `.${href}/index.tsx`;
    const flat = `.${href}.tsx`;
    expect(pages.some((p) => p === file || p === flat)).toBe(true);
  });
});
