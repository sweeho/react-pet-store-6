import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import Home from "./index";

const AREA_ROUTES = ["/petstore", "/petstore/cart", "/petstore/signin", "/admin", "/supplier"];

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );

describe("Landing page", () => {
  it("[SWHR2-C-0270] renders the Pet Store welcome heading", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome to Pet Store" }),
    ).toBeInTheDocument();
  });

  it.each(AREA_ROUTES)("[SWHR2-C-0271] links exactly once to %s", (route) => {
    renderHome();

    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs.filter((h) => h === route)).toHaveLength(1);
  });

  it("[SWHR2-C-0272] marks staff-only areas with Staff sign-in", () => {
    renderHome();

    expect(screen.getAllByText("Staff sign-in").length).toBeGreaterThanOrEqual(1);
  });
});
