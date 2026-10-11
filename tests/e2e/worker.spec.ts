import { expect, test } from "@playwright/test";

// Seeded demo accounts (supabase/seed.sql); one per project so parallel runs don't collide.
const ACCOUNTS: Record<string, { email: string; slug: string }> = {
  desktop: { email: "davit.lomidze@example.com", slug: "davit-lomidze" },
  mobile: { email: "sandro.mchedlishvili@example.com", slug: "sandro-mchedlishvili" },
};

test("worker can log in, edit their profile and see it published", async ({ page }, testInfo) => {
  const account = ACCOUNTS[testInfo.project.name] ?? ACCOUNTS.desktop;
  await page.goto("/en/auth/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);

  const headline = `Handyman for every home job ${Date.now()}`;
  await page.goto("/en/dashboard/profile");
  await page.getByLabel("Headline").fill(headline);
  // Submit with Enter: the save button is in a sticky bar, which Playwright's click targeting dislikes.
  await page.getByLabel("Headline").press("Enter");
  await expect(page.getByText("Profile saved")).toBeVisible();

  // Public page reflects the change immediately (cache tags are invalidated by the action).
  await page.goto(`/en/workers/${account.slug}`);
  await expect(page.getByText(headline)).toBeVisible();
});
