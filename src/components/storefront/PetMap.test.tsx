import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import PetMap from "./PetMap";

describe("PetMap", () => {
  it("shows a picture with a selectable region per pet linking to its category page", () => {
    render(
      <MemoryRouter>
        <PetMap />
      </MemoryRouter>,
    );
    const picture = screen.getByRole("img", { name: /pet/i });
    // Regions are overlay links, not a fixed-coordinate image map (which never rescales).
    expect(picture.getAttribute("usemap")).toBeNull();
    expect(document.querySelector("map, area")).toBeNull();
    expect(picture.className).not.toContain("h-[300px]");
    const hrefs = ["Birds", "Fish", "Dogs", "Reptiles", "Cats"].map((n) => [
      ...new Set(screen.getAllByRole("link", { name: n }).map((a) => a.getAttribute("href"))),
    ]);
    expect(hrefs).toEqual([
      ["/petstore/category/BIRDS"],
      ["/petstore/category/FISH"],
      ["/petstore/category/DOGS"],
      ["/petstore/category/REPTILES"],
      ["/petstore/category/CATS"],
    ]);
  });
});
