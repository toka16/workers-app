import { expect, test } from "@playwright/test";

test.describe("visitor journey (no account)", () => {
  test("landing → search with filters → worker profile with contacts", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("every job at home");

    // Hero search: pick a city and search.
    await page.locator("form select").nth(1).selectOption("tbilisi");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/en\/workers\?city=tbilisi/);
    await expect(page.getByText(/workers? found/)).toBeVisible();

    // Filters live in the URL, so a reload keeps them.
    await page.reload();
    await expect(page.getByRole("button", { name: /Tbilisi/ })).toBeVisible();

    // Open the first result.
    await page.locator('a[href^="/en/workers/"]').first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href^="tel:"]:visible').first()).toBeVisible();
  });

  test("language switch keeps the current page", async ({ page }) => {
    await page.goto("/en/workers");
    await page.getByRole("button", { name: "ქარ" }).first().click();
    await expect(page).toHaveURL(/localhost:\d+\/workers$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ხელოსნის ძებნა");
  });

  test("dashboard requires login", async ({ page }) => {
    await page.goto("/en/dashboard/profile");
    await expect(page).toHaveURL(/\/en\/auth\/login\?next=%2Fdashboard%2Fprofile/);
  });
});
