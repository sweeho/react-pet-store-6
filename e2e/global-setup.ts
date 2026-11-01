import { chromium, type FullConfig } from "@playwright/test";

/**
 * Vite's dev server invalidates and re-optimizes its dependency cache
 * whenever it's cold (a fresh clone, or after a vite.config.ts change) and
 * forces a full client reload the first time a browser loads the app
 * afterwards. Playwright's `webServer.url` readiness check is a plain HTTP
 * fetch of the HTML shell, so it doesn't trigger or wait for that — the
 * real first navigation from a test could otherwise land mid-reload and
 * see a blank page. Do one throwaway navigation here, before any test
 * runs, so the cache is warm by the time real assertions run.
 *
 * The sign-on specs also race a page navigation against a sign-in response
 * (a cancelled response never stores its cookie), so the admin and supplier
 * screens and their sign-in routes are compiled here too, with credentials
 * that are rejected and so change no session.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL!);
  await page.waitForLoadState("networkidle");
  // Compile the cart screens up front so a test's first visit is not the one that pays for it.
  for (const path of ["/petstore/item/EST-1", "/petstore/cart", "/petstore/change-language"]) {
    await page.goto(`${baseURL}${path}`);
    await page.waitForLoadState("networkidle");
  }
  for (const area of ["admin", "supplier"]) {
    await page.goto(`${baseURL}/${area}`);
    await page.waitForLoadState("networkidle");
    await page.request.post(`${baseURL}/api/${area}/sign-in`, {
      data: { userId: "warm-up", password: "warm-up" },
      failOnStatusCode: false,
    });
  }
  // Compile the checkout screens and routes too: the first checkout spec otherwise spends its
  // short expect timeout on the dev server compiling them. The signed-in session lives in this
  // throwaway context; the empty-cart POST compiles /api/orders without placing an order.
  await page.request.post(`${baseURL}/api/session/sign-in`, {
    data: { userId: "j2ee", password: "j2ee" },
    failOnStatusCode: false,
  });
  await page.request.get(`${baseURL}/api/checkout`, { failOnStatusCode: false });
  await page.request.post(`${baseURL}/api/orders`, { data: {}, failOnStatusCode: false });
  for (const path of [
    "/petstore/signin",
    "/petstore/item/EST-4",
    "/petstore/checkout",
    "/petstore/confirm-order",
    "/petstore/order-placed",
    "/petstore/error/server",
    "/petstore/error/empty-cart",
  ]) {
    await page.goto(`${baseURL}${path}`);
    await page.waitForLoadState("networkidle");
  }
  await browser.close();
}
