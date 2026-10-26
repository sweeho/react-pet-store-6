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
    if (p.endsWith("/orders")) {
      const status = url.searchParams.get("status");
      const orders = Object.entries(stored)
        .filter(([, s]) => s === status)
        .map(([id, s]) => ({
          id,
          orderId: id,
          userId: "j2ee",
          date: "3/5/2002",
          amount: 50,
          totalPrice: 50,
          status: s,
          locale: "en_US",
        }));
      return route.fulfill({ json: { items: orders, orders } });
    }
    if (/\/sales\/(revenue|order-counts)/.test(p))
      return route.fulfill({ json: [{ key: "FISH", label: "Fish", value: 35 }] });
    return route.fulfill({ json: { items: [], data: [] } });
  });
  await page.goto("/admin/tool");
  return requests;
}

const refresh = (p: Page) => p.getByRole("button", { name: /refresh/i }).click();
const tab = (p: Page, name: RegExp) =>
  p.getByRole("tab", { name }).or(p.getByRole("button", { name }));
const row = (p: Page, id: string) => p.getByRole("row").filter({ hasText: id });
const DATE = (d: string, iso: string) => new RegExp(`${d}|${iso}`);

test.describe("sales reporting tool", () => {
  // case: SWHR2-C-0003@v1
  test("SWHR2-C-0003: the pie and bar charts open with the default range 01/01/2001 to 12/31/2002", async ({
    page,
  }) => {
    await openTool(page, {});
    await tab(page, /sales/i).click();
    for (const chart of [/pie/i, /bar/i]) {
      await tab(page, chart).click();
      await expect(page.getByLabel(/start/i).first()).toHaveValue(DATE("01/01/2001", "2001-01-01"));
      await expect(page.getByLabel(/end/i).first()).toHaveValue(DATE("12/31/2002", "2002-12-31"));
    }
  });

  // case: SWHR2-C-0004@v1
  test("SWHR2-C-0004: View Non-Pending Orders lists APPROVED, DENIED and COMPLETED orders but no PENDING order", async ({
    page,
  }) => {
    await openTool(page, {
      "1001": "APPROVED",
      "1002": "DENIED",
      "1003": "COMPLETED",
      "1004": "PENDING",
    });
    await refresh(page);
    await tab(page, /non-?pending/i).click();
    for (const id of ["1001", "1002", "1003"]) await expect(row(page, id).first()).toBeVisible();
    await expect(row(page, "1004")).toHaveCount(0);
  });

  // case: SWHR2-C-0005@v1
  test("SWHR2-C-0005: Refresh shows an order denied after the non-pending screen was opened", async ({
    page,
  }) => {
    const stored: Record<string, Status> = { "1005": "PENDING" };
    await openTool(page, stored);
    await tab(page, /non-?pending/i).click();
    await expect(row(page, "1005")).toHaveCount(0);
    stored["1005"] = "DENIED";
    await expect(row(page, "1005")).toHaveCount(0);
    await refresh(page);
    await expect(row(page, "1005").first()).toContainText("DENIED");
  });

  // case: SWHR2-C-0009@v1
  test("SWHR2-C-0009: launching the tool shows the Orders view with lists and both charts populated", async ({
    page,
  }) => {
    await openTool(page, { "1001": "APPROVED", "1002": "PENDING" });
    await expect(tab(page, /orders/i).first()).toBeVisible();
    await expect(row(page, "1002").first()).toBeVisible();
    await tab(page, /non-?pending/i).click();
    await expect(row(page, "1001").first()).toBeVisible();
    await tab(page, /sales/i).click();
    await tab(page, /pie/i).click();
    await expect(page.locator(".recharts-wrapper").first()).toBeVisible();
    await expect(page.locator(".recharts-pie-sector").first()).toBeVisible();
    await expect(page.locator(".recharts-wrapper").first()).toContainText(/fish/i);
    await tab(page, /bar/i).click();
    await expect(page.locator(".recharts-wrapper").first()).toBeVisible();
    await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
    await expect(page.locator(".recharts-wrapper").first()).toContainText(/fish/i);
  });

  // case: SWHR2-C-0010@v1
  test("SWHR2-C-0010: Refresh reloads the order lists and both charts, showing a newly approved order", async ({
    page,
  }) => {
    const stored: Record<string, Status> = { "1006": "PENDING" };
    const requests = await openTool(page, stored);
    stored["1006"] = "APPROVED";
    const before = requests.length;
    await refresh(page);
    await tab(page, /non-?pending/i).click();
    await expect(row(page, "1006").first()).toContainText("APPROVED");
    const after = requests.slice(before).map((r) => r.url());
    expect(after.some((u) => /\/orders\?/.test(u))).toBe(true);
    expect(after.some((u) => /\/sales\/revenue/.test(u))).toBe(true);
    expect(after.some((u) => /\/sales\/order-counts/.test(u))).toBe(true);
  });

  // case: SWHR2-C-0011@v1
  test("SWHR2-C-0011: switching from Orders to Sales shows the pie and bar chart tabs", async ({
    page,
  }) => {
    await openTool(page, { "1001": "APPROVED" });
    await tab(page, /non-?pending/i).click();
    await expect(row(page, "1001").first()).toBeVisible();
    await tab(page, /sales/i).click();
    await expect(tab(page, /pie/i)).toBeVisible();
    await expect(tab(page, /bar/i)).toBeVisible();
    await expect(row(page, "1001")).toHaveCount(0);
  });
});
