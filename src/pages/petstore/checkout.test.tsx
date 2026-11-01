import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Checkout from "./checkout";
import OrderPlaced from "./order-placed";

afterEach(() => vi.unstubAllGlobals());

const contact = {
  givenName: "ABC",
  familyName: "XYZ",
  street: "1 Main St",
  street2: "",
  city: "Palo Alto",
  state: "CA",
  country: "USA",
  zip: "94303",
  email: "abc@xyz.com",
  phone: "555-555-5555",
};
const prefill = {
  locale: "en_US",
  billing: contact,
  shipping: contact,
  lines: [
    {
      itemId: "EST-1",
      name: "Large Angelfish",
      productName: "Angelfish",
      attribute: "",
      quantity: 2,
      unitPrice: 1650,
      lineTotal: 3300,
    },
  ],
  total: 3300,
};

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.pathname + l.search}</p>;
}

function mount(replies: { get?: () => Response; post?: () => Response } = {}) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async (url, init) =>
      init?.method === "POST"
        ? (replies.post?.() ?? Response.json({ orderId: "10011" }))
        : url === "/api/checkout"
          ? (replies.get?.() ?? Response.json(prefill))
          : Response.json({}),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={["/petstore/checkout"]}>
      <Routes>
        <Route path="/petstore/checkout" element={<Checkout />} />
        <Route path="/petstore/order-placed" element={<OrderPlaced />} />
        <Route path="*" element={null} />
      </Routes>
      <Where />
    </MemoryRouter>,
  );
  return fetchMock;
}

const next = () => screen.getAllByRole("button", { name: /^place order$/i })[0];
/** Place order on the form as shown. */
async function place() {
  await screen.findAllByLabelText(/^given name$/i);
  fireEvent.click(next());
}

describe("checkout page", () => {
  it("[SWHR2-C-0089] shows the billing and shipping information form", async () => {
    mount();
    expect(
      await screen.findByRole("heading", { name: /billing and shipping information/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Large Angelfish")).toBeInTheDocument();
  });

  it("[SWHR2-C-0215] pre-fills billing and shipping from the account", async () => {
    mount();
    const given = await screen.findAllByLabelText(/^given name$/i);
    expect(given).toHaveLength(2);
    for (const el of given) expect(el).toHaveValue("ABC");
    for (const el of screen.getAllByLabelText(/^street address$/i))
      expect(el).toHaveValue("1 Main St");
    for (const el of screen.getAllByLabelText(/^country$/i)) expect(el).toHaveValue("USA");
    for (const el of screen.getAllByLabelText(/^e-mail$/i)) expect(el).toHaveValue("abc@xyz.com");
  });

  it("[SWHR2-C-0216] submitting unchanged posts the pre-filled details and shows the order id", async () => {
    const fetchMock = mount();
    await place();
    expect((await screen.findAllByText("10011"))[0]).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post?.[0]).toBe("/api/orders");
    const sent = JSON.parse(String(post?.[1]?.body)) as { billing: object; shipping: object };
    expect(sent.billing).toMatchObject({ givenName: "ABC", street: "1 Main St", state: "CA" });
    expect(sent.shipping).toEqual(sent.billing);
    expect(screen.getByText(/abc@xyz\.com/)).toBeInTheDocument();
  });

  it("[SWHR2-C-0254] accepts typed values (State is a text field) with no sign-in step", async () => {
    const fetchMock = mount();
    const states = await screen.findAllByLabelText(/^state or province$/i);
    fireEvent.change(states[1], { target: { value: "NY" } });
    fireEvent.click(next());
    await screen.findAllByText("10011");
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(post?.[1]?.body)).shipping.state).toBe("NY");
    expect(screen.queryByText(/sign in/i)).toBeNull();
  });

  it("[SWHR2-C-0254] alerts on an empty required field and does not submit", async () => {
    const fetchMock = mount();
    const streets = await screen.findAllByLabelText(/^street address$/i);
    fireEvent.change(streets[0], { target: { value: "  " } });
    fireEvent.click(next());
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  it("[SWHR2-C-0252] sends a visitor who is not signed in to sign in, then back", async () => {
    mount({ get: () => Response.json({ kind: "SignOnRequired" }, { status: 401 }) });
    await waitFor(() =>
      expect(screen.getByTestId("where").textContent).toBe(
        `/petstore/signin?return=${encodeURIComponent("/petstore/checkout")}`,
      ),
    );
  });

  it("[SWHR2-C-0090] sends an EmptyCartOrder reply to the empty-cart error page", async () => {
    mount({
      post: () =>
        Response.json(
          { kind: "EmptyCartOrder", kinds: ["EmptyCartOrder", "OrderFailure", "AppFailure"] },
          { status: 422 },
        ),
    });
    await place();
    await waitFor(() =>
      expect(screen.getByTestId("where").textContent).toBe("/petstore/error/empty-cart"),
    );
  });

  it("[SWHR2-C-0212] sends an unexpected failure to the Server Error page", async () => {
    mount({
      post: () =>
        Response.json(
          { kind: "AppFailure", kinds: ["AppFailure"], message: "boom-test", trace: "at x" },
          { status: 500 },
        ),
    });
    await place();
    await waitFor(() =>
      expect(screen.getByTestId("where").textContent).toBe("/petstore/error/server"),
    );
  });
});
