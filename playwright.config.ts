import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && node scripts/serve-out.mjs ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
