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

describe("error pages from a failed placement", () => {
  const withState = (C: () => React.JSX.Element, state: object) => {
    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: "/petstore/error/server", state }]}>
        <C />
      </MemoryRouter>,
    );
    return container.textContent ?? "";
  };

  it("[SWHR2-C-0212] the server page shows the message, the trace and asks to notify the administrator", () => {
    const t = withState(Server, {
      message: "boom-test",
      trace: "Error: boom-test\n    at place (x.ts:1:1)",
    });
    expect(t).toMatch(/server error/i);
    expect(t).toContain("boom-test");
    expect(t).toContain("at place (x.ts:1:1)");
    expect(t).toMatch(/notify the administrator/i);
  });
});
