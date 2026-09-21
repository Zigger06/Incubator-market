import { expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
export const origin = "http://incubator.test/Incubator-market/";
const mime: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};
export async function offlineSite(page: Page, dark: boolean, locale = "tj") {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "incubator.test") return route.abort();
    const relative =
      decodeURIComponent(url.pathname).replace(/^\/Incubator-market\//, "") ||
      "index.html";
    const file = resolve(process.env.UI_DIST_DIR || "dist", relative);
    if (!file.startsWith(resolve(process.env.UI_DIST_DIR || "dist") + "/"))
      return route.abort();
    try {
      await route.fulfill({
        body: await readFile(file),
        contentType: mime[extname(file)] || "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "Not found" });
    }
  });
  await page.addInitScript(
    ({ dark, locale }) => {
      if (localStorage.getItem("im:dark") === null)
        localStorage.setItem("im:dark", JSON.stringify(dark));
      if (localStorage.getItem("im:locale") === null)
        localStorage.setItem("im:locale", JSON.stringify(locale));
    },
    { dark, locale },
  );
}
export async function ready(page: Page, path: string) {
  await page.goto(origin + "#" + path);
  await expect(page.locator("main h1")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
