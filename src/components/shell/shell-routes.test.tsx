import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import NotFound from "../../pages/NotFound";
import AppShell from "./AppShell";

// Mirrors the hrefs in src/constants/navigation.ts (NAV_AREAS).
const AREA_ROUTES = [
  "/petstore",
  "/petstore/cart",
  "/petstore/checkout",
  "/petstore/signin",
  "/petstore/account",
  "/petstore/language",
  "/admin/orders",
  "/admin/sales",
  "/supplier",
];
const ROUTES = ["/", "/about", ...AREA_ROUTES, "/does-not-exist"];

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <Routes>
          <Route path="/" element={<h1>Landing</h1>} />
          <Route path="/about" element={<h1>About</h1>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </MemoryRouter>,
  );
}

describe("shell on every route", () => {
  it.each(ROUTES)("[SWHR2-C-0273] shows the global navigation on %s", (path) => {
    renderApp(path);
    const nav = screen.getByRole("navigation", { name: "Global" });
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it.each(ROUTES)("[SWHR2-C-0276] shows header, nav, main and footer on %s", (path) => {
    renderApp(path);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
  });

  it("[SWHR2-C-0274] the Home link in the navigation returns to the landing page", async () => {
    renderApp("/about");
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole("navigation", { name: "Global" })).getByRole("link", {
        name: "Home",
      }),
    );
    expect(screen.getByRole("heading", { name: "Landing" })).toBeInTheDocument();
  });
});
