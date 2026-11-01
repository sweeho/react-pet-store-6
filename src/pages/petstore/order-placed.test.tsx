import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import OrderPlaced from "./order-placed";

describe("order placed page", () => {
  it("[SWHR2-C-0101] shows the order id and the confirmation e-mail address", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/petstore/order-placed", state: { orderId: "10011", email: "abc@xyz.com" } },
        ]}
      >
        <OrderPlaced />
      </MemoryRouter>,
    );
    expect(screen.getByText(/^order placed$/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /your order is complete/i })).toBeInTheDocument();
    expect(screen.getAllByText("10011").length).toBeGreaterThan(0);
    expect(screen.getByText(/abc@xyz\.com/)).toBeInTheDocument();
  });
});
