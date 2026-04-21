import { test, expect } from "@playwright/test";
test("app shell responds", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(500);
});
