import { expect, test, type Page, type Request } from "@playwright/test";

type Status = "PENDING" | "APPROVED" | "DENIED" | "COMPLETED";

/** Fakes the admin API in the browser so each test controls what is "stored" and sees every request. */
async function openTool(page: Page, stored: Record<string, Status>) {
  const requests: Request[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/admin/")) requests.push(r);
  });
  await page.route("**/api/admin/**", async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    if (p.endsWith("/session")) return route.fulfill({ json: { signedOn: true } });
    if (p.endsWith("/orders") && route.request().method() === "GET") {
      const status = url.searchParams.get("status");
      const orders = Object.entries(stored)
        .filter(([, s]) => s === status)
        .map(([orderId, s]) => ({ orderId, status: s, locale: "en_US", totalPrice: 600 }));
      return route.fulfill({ json: { items: orders, orders } });
    }
    if (p.endsWith("/decisions")) return route.fulfill({ status: 202, json: {} });
    if (/revenue|count|orders-by/i.test(p))
      return route.fulfill({ json: [{ key: "FISH", label: "Fish", value: 35 }] });
    return route.fulfill({ json: { items: [], data: [] } });
  });
  await page.goto("/admin/tool");
  return requests;
}

const orderReqs = (reqs: Request[]) =>
  reqs
    .filter((r) => /\/orders\?/.test(r.url()))
    .map((r) => new URL(r.url()).searchParams.get("status"));
const chartReqs = (reqs: Request[], kind: RegExp) => reqs.filter((r) => kind.test(r.url()));
const refresh = (p: Page) => p.getByRole("button", { name: /refresh/i }).click();
const row = (p: Page, id: string) => p.getByRole("row").filter({ hasText: id });
const markRow = async (p: Page, id: string, action: RegExp) => {
  await row(p, id).getByRole("checkbox").check();
  await p.getByRole("button", { name: action }).click();
};
const ALL = ["APPROVED", "COMPLETED", "DENIED", "PENDING"];
const SEED: Record<string, Status> = {
  "1001": "PENDING",
  "1002": "APPROVED",
  "1003": "DENIED",
  "1004": "COMPLETED",
};

test.describe("order approval tool", () => {
  // case: SWHR2-C-0240@v1
  test("SWHR2-C-0240: on start the tool loads all four statuses and both charts without a refresh", async ({
    page,
  }) => {
    const reqs = await openTool(page, SEED);
    await expect(page.getByText("1001")).toBeVisible();
    expect(orderReqs(reqs).sort()).toEqual(ALL);
    expect(chartReqs(reqs, /revenue/i).length).toBeGreaterThan(0);
    expect(chartReqs(reqs, /count|orders-by|order-count/i).length).toBeGreaterThan(0);
    // the fake returns a FISH value for both charts: it must be drawn, without any refresh
    const chart = page.locator(".recharts-wrapper").first();
    await expect(chart).toBeVisible();
    await expect(chart).toContainText(/fish/i);
    await expect(
      page.locator(".recharts-pie-sector, .recharts-bar-rectangle").first(),
    ).toBeVisible();
  });

  // case: SWHR2-C-0241@v1
  test("SWHR2-C-0241: refresh reloads all four statuses and the chart data for the current date range", async ({
    page,
  }) => {
    const reqs = await openTool(page, SEED);
    await page
      .getByLabel(/^(start|from)( date)?:?$/i)
      .first()
      .fill("01/01/2002");
    await page
      .getByLabel(/^(end|to)( date)?:?$/i)
      .first()
      .fill("06/30/2002");
    await page
      .getByRole("button", { name: /submit/i })
      .first()
      .click();
    reqs.length = 0;
    await refresh(page);
    await expect.poll(() => orderReqs(reqs).length).toBe(4);
    expect(orderReqs(reqs).sort()).toEqual(ALL);
    const charts = chartReqs(reqs, /revenue|count/i).map((r) => decodeURIComponent(r.url()));
    expect(charts.length).toBeGreaterThan(0);
    for (const u of charts) expect(u).toMatch(/01\/01\/2002|2002-01-01/);
  });

  // case: SWHR2-C-0242@v1
  test("SWHR2-C-0242: PENDING orders appear only in the pending view, the rest only in the non-pending view", async ({
    page,
  }) => {
    await openTool(page, SEED);
    const pending = page.getByRole("tabpanel").first();
    await expect(pending.getByText("1001")).toBeVisible();
    for (const id of ["1002", "1003", "1004"]) await expect(pending.getByText(id)).toHaveCount(0);
    await page.getByRole("tab", { name: /non-?pending/i }).click();
    const other = page.getByRole("tabpanel").filter({ visible: true });
    for (const id of ["1002", "1003", "1004"]) await expect(other.getByText(id)).toBeVisible();
    await expect(other.getByText("1001")).toHaveCount(0);
  });

  // case: SWHR2-C-0243@v1
  test("SWHR2-C-0243: after a refresh an order approved since the last load appears as APPROVED in the non-pending view", async ({
    page,
  }) => {
    const stored: Record<string, Status> = { ...SEED, "1005": "PENDING" };
    await openTool(page, stored);
    stored["1005"] = "APPROVED";
    await refresh(page);
    await page.getByRole("tab", { name: /non-?pending/i }).click();
    await expect(row(page, "1005")).toContainText("APPROVED");
    await page.getByRole("tab", { name: /^pending/i }).click();
    await expect(page.getByText("1005")).toHaveCount(0);
  });

  // case: SWHR2-C-0244@v1
  test("SWHR2-C-0244: marking orders changes no stored status before commit", async ({ page }) => {
    const stored: Record<string, Status> = {
      "1001": "PENDING",
      "1002": "PENDING",
      "1003": "PENDING",
    };
    const reqs = await openTool(page, stored);
    await markRow(page, "1001", /approve/i);
    await markRow(page, "1002", /approve/i);
    await markRow(page, "1003", /deny/i);
    // nothing that could change a stored status was sent: no write request of any kind
    expect(reqs.filter((r) => !["GET", "HEAD", "OPTIONS"].includes(r.method()))).toHaveLength(0);
  });

  // case: SWHR2-C-0247@v1
  test("SWHR2-C-0247: declining the refresh warning keeps the APPROVED mark and sends no data request", async ({
    page,
  }) => {
    const reqs = await openTool(page, { "1001": "PENDING" });
    await markRow(page, "1001", /approve/i);
    reqs.length = 0;
    page.once("dialog", (d) => d.dismiss());
    await refresh(page);
    await expect(row(page, "1001")).toContainText("APPROVED");
    expect(orderReqs(reqs)).toEqual([]);
  });

  // case: SWHR2-C-0248@v1
  test("SWHR2-C-0248: confirming the refresh warning reloads and the order shows PENDING again", async ({
    page,
  }) => {
    const reqs = await openTool(page, { "1001": "PENDING" });
    await markRow(page, "1001", /deny/i);
    reqs.length = 0;
    page.once("dialog", (d) => d.accept());
    await refresh(page);
    await expect.poll(() => orderReqs(reqs).length).toBeGreaterThan(0);
    await expect(row(page, "1001")).toContainText("PENDING");
  });

  // case: SWHR2-C-0249@v1
  test("SWHR2-C-0249: refreshing with nothing marked reloads straight away with no warning", async ({
    page,
  }) => {
    const reqs = await openTool(page, { "1001": "PENDING" });
    let warned = false;
    page.on("dialog", (d) => {
      warned = true;
      void d.dismiss();
    });
    reqs.length = 0;
    await refresh(page);
    await expect.poll(() => orderReqs(reqs).length).toBeGreaterThan(0);
    expect(warned).toBe(false);
  });
});
