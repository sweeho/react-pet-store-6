import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Checkout from "./checkout";
import OrderPlaced from "./order-placed";
import Server from "./error/server";

afterEach(() => vi.unstubAllGlobals());

const person = {
  givenName: "ABC",
  familyName: "XYZ",
  street: "1 Main St",
  street2: "",
  city: "Palo Alto",
  state: "CA",
  zip: "94303",
  country: "USA",
  phone: "555-555-5555",
  email: "abc@xyz.com",
};
const cart = {
  locale: "en_US",
  lines: [
    {
      itemId: "EST-1",
      quantity: 2,
      name: "Large Angelfish",
      attribute: "",
      productName: "Angelfish",
      unitPrice: 1650,
      lineTotal: 3300,
    },
  ],
  total: 3300,
};

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;
function mount(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url}`;
    return (handlers[key] ?? (() => Response.json({})))(url, init);
  });
  vi.stubGlobal("fetch", fetchMock);
  const Here = () => <p data-testid="at">{useLocation().pathname}</p>;
  render(
    <MemoryRouter initialEntries={["/petstore/checkout"]}>
      <Routes>
        <Route path="/petstore/checkout" element={<Checkout />} />
        <Route path="/petstore/order-placed" element={<OrderPlaced />} />
        <Route path="*" element={<Here />} />
      </Routes>
    </MemoryRouter>,
  );
  return fetchMock;
}
const base: Record<string, Handler> = {
  "GET /api/checkout": () => Response.json({ billing: person, shipping: person }),
  "GET /api/cart": () => Response.json(cart),
};

describe("checkout page", () => {
  it("[SWHR2-C-0215] shows the account details in both the billing and the shipping block", async () => {
    mount(base);
    await waitFor(() => expect(screen.getAllByLabelText(/given name/i)).toHaveLength(2));
    for (const [label, value] of [
      [/given name/i, "ABC"],
      [/family name/i, "XYZ"],
      [/street/i, "1 Main St"],
      [/city/i, "Palo Alto"],
      [/state/i, "CA"],
      [/zip|postal/i, "94303"],
      [/country/i, "USA"],
      [/telephone/i, "555-555-5555"],
      [/e-?mail/i, "abc@xyz.com"],
    ] as const) {
      const fields = screen.getAllByLabelText(label);
      expect(fields).toHaveLength(2);
      for (const f of fields) expect(f).toHaveValue(value);
    }
  });

  it("[SWHR2-C-0089] opening checkout shows the address entry form and the order lines", async () => {
    mount(base);
    expect((await screen.findAllByLabelText(/^street address$/i))[0]).toBeVisible();
    expect(await screen.findByText("Large Angelfish")).toBeVisible();
  });

  it("[SWHR2-C-0252] a visitor who is not signed in is sent to sign in", async () => {
    mount({
      ...base,
      "GET /api/checkout": () => Response.json({ kind: "SignOnRequired" }, { status: 401 }),
    });
    await waitFor(() => expect(screen.getByTestId("at")).toHaveTextContent("/petstore/signin"));
  });

  it("[SWHR2-C-0216] submitting the pre-filled form posts the pre-filled details and shows the order id", async () => {
    const post = vi.fn(() => Response.json({ orderId: "10011" }));
    mount({ ...base, "POST /api/orders": post });
    await screen.findAllByLabelText(/given name/i);
    fireEvent.click(screen.getAllByRole("button", { name: /place order/i })[0]);
    await waitFor(() => expect(post).toHaveBeenCalled());
    const body = JSON.parse(
      String(
        (post.mock.calls[0] as unknown[])[1] &&
          ((post.mock.calls[0] as unknown[])[1] as RequestInit).body,
      ),
    );
    expect(body.billing).toMatchObject({
      givenName: "ABC",
      street: "1 Main St",
      email: "abc@xyz.com",
    });
    expect(body.shipping).toMatchObject({ givenName: "ABC", country: "USA" });
    expect(await screen.findByText("10011")).toBeVisible();
  });

  it("[SWHR2-C-0254] a signed-in customer submits the form without a sign-in prompt and reaches the confirmation", async () => {
    mount({ ...base, "POST /api/orders": () => Response.json({ orderId: "10012" }) });
    await screen.findAllByLabelText(/given name/i);
    fireEvent.click(screen.getAllByRole("button", { name: /place order/i })[0]);
    expect(await screen.findByRole("heading", { name: /your order is complete/i })).toBeVisible();
    expect(screen.queryByLabelText(/given name/i)).toBeNull();
  });

  it("[SWHR2-C-0174] a customer who has just created an account can place an order from checkout", async () => {
    const post = vi.fn(() => Response.json({ orderId: "10013" }));
    mount({ ...base, "POST /api/orders": post });
    await screen.findAllByLabelText(/given name/i);
    fireEvent.click(screen.getAllByRole("button", { name: /place order/i })[0]);
    expect(await screen.findByRole("heading", { name: /your order is complete/i })).toBeVisible();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("[SWHR2-C-0090] an empty-cart refusal goes to the empty-cart error page", async () => {
    mount({
      ...base,
      "POST /api/orders": () =>
        Response.json(
          { kind: "EmptyCartOrder", kinds: ["EmptyCartOrder", "OrderFailure", "AppFailure"] },
          { status: 422 },
        ),
    });
    await screen.findAllByLabelText(/given name/i);
    fireEvent.click(screen.getAllByRole("button", { name: /place order/i })[0]);
    await waitFor(() =>
      expect(screen.getByTestId("at")).toHaveTextContent("/petstore/error/empty-cart"),
    );
  });

  it("[SWHR2-C-0212] an unexpected failure goes to the Server Error page", async () => {
    mount({
      ...base,
      "POST /api/orders": () =>
        Response.json(
          {
            kind: "AppFailure",
            kinds: ["AppFailure"],
            message: "boom-test",
            trace: "Error: boom-test\n    at x (a.ts:1:2)",
          },
          { status: 500 },
        ),
    });
    await screen.findAllByLabelText(/given name/i);
    fireEvent.click(screen.getAllByRole("button", { name: /place order/i })[0]);
    await waitFor(() =>
      expect(screen.getByTestId("at")).toHaveTextContent("/petstore/error/server"),
    );
  });
});

describe("order placed page", () => {
  it("[SWHR2-C-0101] shows the order id and a complete heading once the cart is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({})),
    );
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/petstore/order-placed", state: { orderId: "10012", email: "abc@xyz.com" } },
        ]}
      >
        <OrderPlaced />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /your order is complete/i })).toBeVisible();
    expect(screen.getByText("10012")).toBeVisible();
  });
});

describe("server error page", () => {
  it("[SWHR2-C-0212] shows the Server Error heading, message, trace and the request to notify the administrator", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/petstore/error/server",
            state: { message: "boom-test", trace: "Error: boom-test\n    at nextId (ids.ts:1:2)" },
          },
        ]}
      >
        <Server />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Server Error" })).toBeVisible();
    expect(screen.getByText(/boom-test/, { selector: "p, div" })).toBeVisible();
    expect(screen.getByText(/at nextId \(ids\.ts:1:2\)/)).toBeVisible();
    expect(screen.getByText(/notify the (store )?administrator/i)).toBeVisible();
  });
});
