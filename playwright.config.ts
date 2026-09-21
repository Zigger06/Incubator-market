import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: process.env.UI_BACKEND ? "forms.spec.ts" : "site.spec.ts",
  outputDir: process.env.UI_BACKEND
    ? "test-results/forms"
    : "test-results/site",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: process.env.UI_BACKEND
          ? "test-results/forms-results.json"
          : "test-results/site-results.json",
      },
    ],
  ],
  use: {
    headless: true,
    launchOptions: process.env.CHROMIUM_PATH
      ? {
          executablePath: process.env.CHROMIUM_PATH,
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--use-gl=angle",
            "--use-angle=swiftshader",
          ],
        }
      : {},
  },
});
