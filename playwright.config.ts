import { defineConfig } from "@playwright/test";

// Smoke tests in a real browser (task smoke-tests, docs/ROADMAP.md 2.7).
// They run against E2E_BASE_URL, or start `npm run dev` on your computer.
// How to run them: docs/setup/smoke-tests.md.

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
// Lets the tests through Vercel's sign-in wall on preview addresses.
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts",
  // The dev server builds each page the first time it is opened.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  // Sign-in tests share one account, so one test at a time.
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    extraHTTPHeaders: bypass ? { "x-vercel-protection-bypass": bypass, "x-vercel-set-bypass-cookie": "true" } : undefined,
  },
  projects: [
    { name: "phone", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
