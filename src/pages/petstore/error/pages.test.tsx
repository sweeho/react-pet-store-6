import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import Catalog from "./catalog";
import EmptyCart from "./empty-cart";
import Server from "./server";

const text = (C: () => React.JSX.Element) => {
  const { container } = render(
    <MemoryRouter>
      <C />
    </MemoryRouter>,
  );
  return container.textContent ?? "";
};

describe("error pages", () => {
  it("[SWHR2-C-0091] the empty-cart page mentions the empty cart and not a server error", () => {
    const t = text(EmptyCart);
    expect(t).toMatch(/cart/i);
    expect(t).toMatch(/empty/i);
    expect(t).not.toMatch(/server error/i);
  });

  it("[SWHR2-C-0091] the catalog page mentions the catalog", () => {
    expect(text(Catalog)).toMatch(/catalog/i);
  });

  it("[SWHR2-C-0092] the server page says server error", () => {
    expect(text(Server)).toMatch(/server error/i);
  });
});
