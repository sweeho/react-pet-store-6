import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Tool from "../../../src/pages/admin/tool";

afterEach(() => vi.unstubAllGlobals());

const ORDERS = [
  { orderId: "1001", status: "PENDING", locale: "en_US", totalPrice: 600 },
  { orderId: "1002", status: "PENDING", locale: "en_US", totalPrice: 700 },
  { orderId: "1003", status: "PENDING", locale: "en_US", totalPrice: 800 },
];
const body = (status: string) => {
  const orders = status === "PENDING" ? ORDERS : [];
  return { items: orders, orders };
};
const ACTIONS = [/approve/i, /deny/i, /commit/i, /submit/i, /refresh/i, /about/i, /exit/i];

const urlOf = (i: RequestInfo | URL) =>
  typeof i === "string" ? i : i instanceof URL ? i.href : i.url;

/** fetch stub: GETs answer with ORDERS; `hold` makes the next request of `method` hang until released. */
function stubFetch(hold?: "GET" | "POST") {
  const calls: { url: string; method: string; body?: string }[] = [];
  let release: (r: Response) => void = () => {};
  let armed = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = urlOf(input);
      const method = init?.method ?? "GET";
      calls.push({ url, method, body: init?.body as string | undefined });
      if (hold === method && armed)
        return new Promise<Response>((res) => {
          release = res;
        });
      if (method === "POST") return new Response(null, { status: 202 });
      return Response.json(body(new URL(url, "http://x").searchParams.get("status") ?? "PENDING"));
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

describe("administration tool", () => {
  // case: SWHR2-C-0235@v1
  it("SWHR2-C-0235: while a commit is in progress the actions are disabled and 'Updating data on the server...' is shown", async () => {
    const f = stubFetch("POST");
    await openTool();
    f.arm();
    mark("1001", /approve/i);
    fireEvent.click(btn(/commit/i));
    expect(await screen.findByText("Updating data on the server...")).toBeInTheDocument();
    for (const a of ACTIONS) expect(btn(a)).toBeDisabled();
  });

  // case: SWHR2-C-0236@v1
  it("SWHR2-C-0236: while a refresh is in progress the actions are disabled and 'Retrieving data from the server...' is shown", async () => {
    const f = stubFetch("GET");
    await openTool();
    f.arm();
    fireEvent.click(btn(/refresh/i));
    expect(await screen.findByText("Retrieving data from the server...")).toBeInTheDocument();
    for (const a of ACTIONS) expect(btn(a)).toBeDisabled();
  });

  // case: SWHR2-C-0237@v1
  it("SWHR2-C-0237: the actions are enabled again once the server reply has been applied", async () => {
    const f = stubFetch("GET");
    await openTool();
    f.arm();
    fireEvent.click(btn(/refresh/i));
    await screen.findByText("Retrieving data from the server...");
    await act(async () => f.release(Response.json(body("PENDING"))));
    await waitFor(() =>
      expect(screen.queryByText("Retrieving data from the server...")).toBeNull(),
    );
    expect(screen.getByText("1001")).toBeInTheDocument();
    for (const a of ACTIONS) expect(btn(a)).toBeEnabled();
  });

  // case: SWHR2-C-0238@v1
  it("SWHR2-C-0238: PENDING is shown yellow, APPROVED green and DENIED red", async () => {
    stubFetch();
    await openTool();
    mark("1002", /approve/i);
    mark("1003", /deny/i);
    const cell = (id: string, text: string) =>
      within(rowOf(id)).getByText(text, { exact: true }) as HTMLElement;
    expect(cell("1001", "PENDING").className).toMatch(/yellow/);
    expect(cell("1002", "APPROVED").className).toMatch(/green/);
    expect(cell("1003", "DENIED").className).toMatch(/red/);
  });

  // case: SWHR2-C-0245@v1
  it("SWHR2-C-0245: committing two approvals and one denial submits all three in exactly one request", async () => {
    const f = stubFetch();
    await openTool();
    mark("1001", /approve/i);
    mark("1002", /approve/i);
    mark("1003", /deny/i);
    const before = f.calls.length;
    fireEvent.click(btn(/commit/i));
    await waitFor(() => expect(f.calls.filter((c) => c.method === "POST")).toHaveLength(1));
    const post = f.calls.filter((c) => c.method === "POST")[0];
    expect(f.calls.slice(before).filter((c) => c.method === "POST")).toHaveLength(1);
    expect(JSON.parse(post.body!).decisions).toEqual(
      expect.arrayContaining([
        { orderId: "1001", status: "APPROVED" },
        { orderId: "1002", status: "APPROVED" },
        { orderId: "1003", status: "DENIED" },
      ]),
    );
    expect(JSON.parse(post.body!).decisions).toHaveLength(3);
  });
});
