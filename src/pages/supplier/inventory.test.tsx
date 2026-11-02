import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import SupplierInventory from "./inventory";

afterEach(() => vi.unstubAllGlobals());

const STOCK = [
  { itemId: "EST-1", quantity: 40 },
  { itemId: "EST-2", quantity: 0 },
  { itemId: "EST-3", quantity: 12 },
];

function setup(post: (body: unknown) => Response = () => Response.json(STOCK)) {
  const posts: unknown[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const body: unknown = JSON.parse(String(init.body));
        posts.push(body);
        return post(body);
      }
      return Response.json(STOCK);
    }),
  );
  render(
    <MemoryRouter initialEntries={["/supplier/inventory"]}>
      <SupplierInventory />
    </MemoryRouter>,
  );
  return posts;
}

describe("supplier inventory page", () => {
  it("[SWHR2-C-0041] lists each record with an empty entry and an unticked marker", async () => {
    setup();
    const rows = await screen.findAllByRole("row");
    expect(rows).toHaveLength(4);
    const first = rows[1];
    expect(within(first).getByText("EST-1")).toBeInTheDocument();
    expect(within(first).getByText("40")).toBeInTheDocument();
    expect(within(first).getByRole("textbox")).toHaveValue("");
    expect(within(first).getByRole("checkbox")).not.toBeChecked();
  });

  it("[SWHR2-C-0042] submits every row with its marked flag and confirms", async () => {
    const posts = setup();
    const user = userEvent.setup();
    await user.type(await screen.findByRole("textbox", { name: /EST-1/ }), "30");
    await user.click(screen.getByRole("checkbox", { name: /EST-1/ }));
    await user.type(screen.getByRole("textbox", { name: /EST-2/ }), "15");
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(await screen.findByText(/inventory updated/i)).toBeInTheDocument();
    expect(posts[0]).toEqual({
      rows: [
        { itemId: "EST-1", quantity: "30", marked: true },
        { itemId: "EST-2", quantity: "15", marked: false },
        { itemId: "EST-3", quantity: "", marked: false },
      ],
    });
  });

  it("[SWHR2-C-0043] shows an alert and keeps the entries on a 400", async () => {
    setup(() => Response.json({}, { status: 400 }));
    const user = userEvent.setup();
    const box = await screen.findByRole("textbox", { name: /EST-1/ });
    await user.type(box, "-4");
    await user.click(screen.getByRole("checkbox", { name: /EST-1/ }));
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /EST-1/ })).toHaveValue("-4");
  });
});
