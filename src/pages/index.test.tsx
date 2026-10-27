import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { NAV_AREAS } from "@/constants/navigation";

import Home from "./index";

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
});
