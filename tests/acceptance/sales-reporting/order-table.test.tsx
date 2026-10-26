import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OrderTable from "../../../src/components/admin/OrderTable";

// Assumed: OrderTable takes `orders` in the API row shape { id, userId, date, amount, status }.
const order = (id: string, amount: number) => ({
  id,
  userId: "j2ee",
  date: "3/5/2002",
  amount,
  status: "APPROVED",
});
const cells = (row: HTMLElement) =>
  within(row)
    .getAllByRole("cell")
    .map((c) => c.textContent);

describe("order list", () => {
  // case: SWHR2-C-0006@v1
  it("SWHR2-C-0006: an order row shows ID, User ID, Date, Amount and Status in their columns", () => {
    render(<OrderTable orders={[order("1001", 120.5)]} />);
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent?.trim())).toEqual([
      "ID",
      "User ID",
      "Date",
      "Amount",
      "Status",
    ]);
    expect(cells(screen.getAllByRole("row")[1])).toEqual([
      "1001",
      "j2ee",
      "3/5/2002",
      "120.50",
      "APPROVED",
    ]);
  });

  // case: SWHR2-C-0007@v1
  it("SWHR2-C-0007: clicking the Amount header re-orders the rows by amount", () => {
    render(<OrderTable orders={[order("1001", 120.5), order("1002", 15), order("1003", 300)]} />);
    fireEvent.click(screen.getByRole("columnheader", { name: /amount/i }));
    const ids = screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => cells(r)[0]);
    expect(ids).toEqual(["1002", "1001", "1003"]);
  });

  // case: SWHR2-C-0008@v1
  it("SWHR2-C-0008: an order with a non-numeric ID shows -1 in the ID column", () => {
    render(<OrderTable orders={[order("ABC", 120.5)]} />);
    expect(cells(screen.getAllByRole("row")[1])).toEqual([
      "-1",
      "j2ee",
      "3/5/2002",
      "120.50",
      "APPROVED",
    ]);
  });
});
