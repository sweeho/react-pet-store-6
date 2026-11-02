import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OrderTable from "./OrderTable";

const order = (id: string, amount: number, userId = "j2ee") => ({
  id,
  userId,
  date: "3/5/2002",
  amount,
  status: "APPROVED",
});
const cells = (row: HTMLElement) =>
  within(row)
    .getAllByRole("cell")
    .map((c) => c.textContent);
const ids = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => cells(r)[0]);

describe("OrderTable", () => {
  it("[SWHR2-C-0006] a row shows ID, User ID, Date, Amount and Status", () => {
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

  it("[SWHR2-C-0007] clicking Amount re-orders by amount, and again reverses", () => {
    render(<OrderTable orders={[order("1001", 120.5), order("1002", 15), order("1003", 300)]} />);
    const amount = screen.getByRole("columnheader", { name: /amount/i });
    fireEvent.click(amount);
    expect(ids()).toEqual(["1002", "1001", "1003"]);
    expect(amount).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(amount);
    expect(ids()).toEqual(["1003", "1001", "1002"]);
  });

  it("[SWHR2-C-0007] sorts on the User ID column too", () => {
    render(<OrderTable orders={[order("1", 1, "b"), order("2", 1, "a")]} />);
    fireEvent.click(screen.getByRole("columnheader", { name: /user id/i }));
    expect(ids()).toEqual(["2", "1"]);
  });

  it("[SWHR2-C-0008] a non-numeric ID shows -1", () => {
    render(<OrderTable orders={[order("ABC", 120.5)]} />);
    expect(cells(screen.getAllByRole("row")[1])[0]).toBe("-1");
  });

  it("[SWHR2-C-0006] shows an empty state when there are no orders", () => {
    render(<OrderTable orders={[]} />);
    expect(screen.getByText("No orders in this status")).toBeInTheDocument();
  });
});
