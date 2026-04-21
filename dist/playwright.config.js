var _a, _b;
import { defineConfig, devices } from "@playwright/test";
const port = Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : "3000");
const baseURL = (_b = process.env.PLAYWRIGHT_BASE_URL) !== null && _b !== void 0 ? _b : `http://127.0.0.1:${port}`;
export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 30000,
    fullyParallel: true,
    retries: process.env.CI ? 1 : 0,
    reporter: "line",
    use: {
        baseURL,
        trace: "on-first-retry",
    },
    webServer: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : {
            command: `npm run dev -- --port ${port}`,
            url: baseURL,
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        },
    projects: [
        {
            name: "chromium",
            use: Object.assign({}, devices["Desktop Chrome"]),
        },
    ],
});
