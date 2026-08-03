import { defineConfig } from "@playwright/test";

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/`;

export default defineConfig({
  testDir: "./e2e/tests",
  testMatch: "**/*.e2e.ts",
  retries: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    // invoked directly instead of via `npx` / `npm exec`: the npm wrapper
    // spawns the actual server as a grandchild that survives the teardown
    // signal and keeps holding the port.
    command: `./node_modules/.bin/serve --no-port-switching -c ../e2e/serve.json -l ${PORT} ./dist`,
    url: BASE_URL,
    reuseExistingServer: false,
  },
});
