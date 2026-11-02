import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Tool from "./tool";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const ORDERS = [
  { orderId: "1001", status: "PENDING", locale: "en_US", totalPrice: 600 },
  { orderId: "1002", status: "PENDING", locale: "en_US", totalPrice: 700 },
  { orderId: "1003", status: "PENDING", locale: "en_US", totalPrice: 800 },
];
const DONE = [{ orderId: "2001", status: "APPROVED", locale: "en_US", totalPrice: 10 }];
const ACTIONS = [/approve/i, /deny/i, /commit/i, /submit/i, /refresh/i, /about/i, /exit/i];

function stubFetch(hold?: "GET" | "POST") {
  const calls: { url: string; method: string; body?: string }[] = [];
  let release: (r: Response) => void = () => {};
  let armed = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? "GET";
      calls.push({ url, method, body: init?.body as string | undefined });
      if (hold === method && armed)
        return new Promise<Response>((res) => {
          release = res;
        });
      if (method === "POST") return new Response(null, { status: 202 });
      const status = new URL(url, "http://x").searchParams.get("status");
      if (url.includes("/sales/")) return Response.json([{ key: "FISH", label: "Fish", value: 3 }]);
      const orders = status === "PENDING" ? ORDERS : status === "APPROVED" ? DONE : [];
      return Response.json({ items: orders, orders });
    }),
  );
  return { calls, arm: () => (armed = true), release: (r: Response) => release(r) };
}

async function openTool() {
  render(
    <MemoryRouter>
      <Tool />
    </MemoryRouter>,
  );
  await screen.findByText("1001");
}
const rowOf = (id: string) => screen.getByText(id).closest("tr") as HTMLElement;
const mark = (id: string, action: RegExp) => {
  fireEvent.click(within(rowOf(id)).getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: action }));
};
const btn = (name: RegExp) => screen.getAllByRole("button", { name })[0];
const statusUrls = (calls: { url: string }[]) =>
  calls
    .filter((c) => /orders\?status=/.test(c.url))
    .map((c) => new URL(c.url, "http://x").searchParams.get("status"));

describe("administration tool", () => {
  it("[SWHR2-C-0235] commit in progress disables the actions", async () => {
    const f = stubFetch("POST");
    await openTool();
    f.arm();
    mark("1001", /approve/i);
    fireEvent.click(btn(/commit/i));
    expect(await screen.findByText("Updating data on the server...")).toBeInTheDocument();
    for (const a of ACTIONS) expect(btn(a)).toBeDisabled();
  });

  it("[SWHR2-C-0236] refresh in progress disables the actions", async () => {
    const f = stubFetch("GET");
    await openTool();
    f.arm();
    fireEvent.click(btn(/refresh/i));
    expect(await screen.findByText("Retrieving data from the server...")).toBeInTheDocument();
    for (const a of ACTIONS) expect(btn(a)).toBeDisabled();
  });

  it("[SWHR2-C-0237] actions are enabled again after the reply", async () => {
    const f = stubFetch("GET");
    await openTool();
    f.arm();
    fireEvent.click(btn(/refresh/i));
    await screen.findByText("Retrieving data from the server...");
    await act(async () => f.release(Response.json({ items: ORDERS, orders: ORDERS })));
    await waitFor(() =>
      expect(screen.queryByText("Retrieving data from the server...")).toBeNull(),
    );
    for (const a of ACTIONS) expect(btn(a)).toBeEnabled();
  });

  it("[SWHR2-C-0238] statuses are coloured yellow, green and red", async () => {
    stubFetch();
    await openTool();
    mark("1002", /approve/i);
    mark("1003", /deny/i);
    const cell = (id: string, t: string) => within(rowOf(id)).getByText(t, { exact: true });
    expect(cell("1001", "PENDING").className).toMatch(/yellow/);
    expect(cell("1002", "APPROVED").className).toMatch(/green/);
    expect(cell("1003", "DENIED").className).toMatch(/red/);
  });

  it("[SWHR2-C-0240] start loads four statuses and both charts", async () => {
    const f = stubFetch();
    await openTool();
    expect(statusUrls(f.calls).sort()).toEqual(["APPROVED", "COMPLETED", "DENIED", "PENDING"]);
    expect(f.calls.some((c) => /sales\/revenue/.test(c.url))).toBe(true);
    expect(f.calls.some((c) => /sales\/order-counts/.test(c.url))).toBe(true);
  });

  it("[SWHR2-C-0241] refresh reloads the four statuses and charts", async () => {
    const f = stubFetch();
    await openTool();
    f.calls.length = 0;
    fireEvent.click(btn(/refresh/i));
    await waitFor(() => expect(statusUrls(f.calls)).toHaveLength(4));
    expect(f.calls.some((c) => /sales\/revenue/.test(c.url))).toBe(true);
  });

  it("[SWHR2-C-0242] pending only in the pending view, the rest in the non-pending view", async () => {
    stubFetch();
    await openTool();
    expect(screen.queryByText("2001")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /non-?pending/i }));
    expect(await screen.findByText("2001")).toBeInTheDocument();
    expect(screen.queryByText("1001")).toBeNull();
  });

  it("[SWHR2-C-0243] a reload shows the stored status in the non-pending view", async () => {
    stubFetch();
    await openTool();
    fireEvent.click(screen.getByRole("tab", { name: /non-?pending/i }));
    expect(within(rowOf("2001")).getByText("APPROVED")).toBeInTheDocument();
  });

  it("[SWHR2-C-0244] marking sends no write request", async () => {
    const f = stubFetch();
    await openTool();
    mark("1001", /approve/i);
    mark("1002", /approve/i);
    mark("1003", /deny/i);
    expect(f.calls.filter((c) => c.method !== "GET")).toHaveLength(0);
  });

  it("[SWHR2-C-0245] commit submits all three decisions in one request", async () => {
    const f = stubFetch();
    await openTool();
    mark("1001", /approve/i);
    mark("1002", /approve/i);
    mark("1003", /deny/i);
    fireEvent.click(btn(/commit/i));
    await waitFor(() => expect(f.calls.filter((c) => c.method === "POST")).toHaveLength(1));
    const post = f.calls.find((c) => c.method === "POST")!;
    expect(JSON.parse(post.body!).decisions).toEqual([
      { orderId: "1001", status: "APPROVED" },
      { orderId: "1002", status: "APPROVED" },
      { orderId: "1003", status: "DENIED" },
    ]);
  });

  it("[SWHR2-C-0247] declining the refresh warning keeps the mark", async () => {
    const f = stubFetch();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await openTool();
    mark("1001", /approve/i);
    f.calls.length = 0;
    fireEvent.click(btn(/refresh/i));
    expect(window.confirm).toHaveBeenCalledWith(
      "Data is not committed. Are you sure you want to refresh?",
    );
    expect(statusUrls(f.calls)).toEqual([]);
    expect(within(rowOf("1001")).getByText("APPROVED")).toBeInTheDocument();
  });

  it("[SWHR2-C-0248] confirming the refresh warning reloads and drops the mark", async () => {
    stubFetch();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await openTool();
    mark("1001", /deny/i);
    fireEvent.click(btn(/refresh/i));
    await waitFor(() => expect(within(rowOf("1001")).getByText("PENDING")).toBeInTheDocument());
  });

  it("[SWHR2-C-0249] refreshing with nothing marked asks nothing", async () => {
    const f = stubFetch();
    const confirm = vi.spyOn(window, "confirm");
    await openTool();
    f.calls.length = 0;
    fireEvent.click(btn(/refresh/i));
    await waitFor(() => expect(statusUrls(f.calls)).toHaveLength(4));
    expect(confirm).not.toHaveBeenCalled();
  });

  it("[SWHR2-C-0009] opens on the Orders view with lists and both charts loaded", async () => {
    const f = stubFetch();
    await openTool();
    expect(screen.getByRole("heading", { name: "Orders and sales" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^orders/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /^pending/i })).toHaveAttribute("aria-selected", "true");
    expect(f.calls.some((c) => /sales\/order-counts/.test(c.url))).toBe(true);
    expect(await screen.findAllByText("Fish")).not.toHaveLength(0);
  });

  it("[SWHR2-C-0011] the Sales view shows Pie chart and Bar chart tabs and no order rows", async () => {
    stubFetch();
    await openTool();
    fireEvent.click(screen.getByRole("tab", { name: /^sales/i }));
    expect(screen.getByRole("tab", { name: /pie chart/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /bar chart/i })).toBeInTheDocument();
    expect(screen.queryByText("1001")).toBeNull();
  });

  it("[SWHR2-C-0003] both chart tabs open on 01/01/2001 to 12/31/2002", async () => {
    stubFetch();
    await openTool();
    fireEvent.click(screen.getByRole("tab", { name: /^sales/i }));
    for (const name of [/pie chart/i, /bar chart/i]) {
      fireEvent.click(screen.getByRole("tab", { name }));
      expect(screen.getAllByLabelText("Start date")[0]).toHaveValue("01/01/2001");
      expect(screen.getAllByLabelText("End date")[0]).toHaveValue("12/31/2002");
    }
  });

  it("[SWHR2-C-0004] the Non-pending tab lists decided orders and no pending order", async () => {
    stubFetch();
    await openTool();
    fireEvent.click(screen.getByRole("tab", { name: /non-?pending/i }));
    expect(await screen.findByText("2001")).toBeInTheDocument();
    expect(screen.queryByText("1001")).toBeNull();
  });

  it("[SWHR2-C-0005] [SWHR2-C-0010] Refresh shows an order decided after opening", async () => {
    const f = stubFetch();
    await openTool();
    fireEvent.click(screen.getByRole("tab", { name: /non-?pending/i }));
    expect(screen.queryByText("1001")).toBeNull();
    DONE.push({ orderId: "1001", status: "DENIED", locale: "en_US", totalPrice: 600 });
    f.calls.length = 0;
    fireEvent.click(btn(/refresh/i));
    expect(await screen.findByText("1001")).toBeInTheDocument();
    expect(f.calls.some((c) => /sales\/revenue/.test(c.url))).toBe(true);
    expect(f.calls.some((c) => /sales\/order-counts/.test(c.url))).toBe(true);
    DONE.pop();
  });
});
