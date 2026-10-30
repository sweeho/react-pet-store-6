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
  for (const area of ["admin", "supplier"]) {
    await page.goto(`${baseURL}/${area}`);
    await page.waitForLoadState("networkidle");
    await page.request.post(`${baseURL}/api/${area}/sign-in`, {
      data: { userId: "warm-up", password: "warm-up" },
      failOnStatusCode: false,
    });
  }
  await browser.close();
}
