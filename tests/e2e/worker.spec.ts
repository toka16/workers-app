import { expect, test, type APIRequestContext } from "@playwright/test";

// Seeded demo accounts (supabase/seed.sql); one per project so parallel runs don't collide.
const ACCOUNTS: Record<string, { email: string; slug: string }> = {
  desktop: { email: "davit.lomidze@example.com", slug: "davit-lomidze" },
  mobile: { email: "sandro.mchedlishvili@example.com", slug: "sandro-mchedlishvili" },
};

/** Local Supabase delivers auth e-mails to Mailpit. */
const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

async function confirmationLink(request: APIRequestContext, email: string): Promise<string> {
  let id: string | undefined;
  await expect
    .poll(async () => {
      const search = await request.get(`${MAILPIT_URL}/api/v1/search`, { params: { query: `to:${email}` } });
      id = (await search.json()).messages?.[0]?.ID;
      return id;
    })
    .toBeTruthy();
  const message = await (await request.get(`${MAILPIT_URL}/api/v1/message/${id}`)).json();
  const link = /href="([^"]*\/auth\/v1\/verify[^"]*)"/.exec(message.HTML)?.[1];
  expect(link).toBeTruthy();
  return link!.replaceAll("&amp;", "&");
}

test("worker can log in, edit their profile and see it published", async ({ page }, testInfo) => {
  const account = ACCOUNTS[testInfo.project.name] ?? ACCOUNTS.desktop;
  await page.goto("/en/auth/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await expect(page.getByRole("link", { name: "Profile status: Live" })).toBeVisible();

  const headline = `Handyman for every home job ${Date.now()}`;
  await page.goto("/en/dashboard/profile/basics");
  await page.getByLabel("Headline").fill(headline);
  // Submit with Enter: the save button is in a sticky bar, which Playwright's click targeting dislikes.
  await page.getByLabel("Headline").press("Enter");
  await expect(page.getByText("Saved. Changes are live on your page.")).toBeVisible();
  await expect(page).toHaveURL(/\/en\/dashboard\/profile\/area$/);

  // Public page reflects the change immediately (cache tags are invalidated by the action).
  await page.goto(`/en/workers/${account.slug}`);
  await expect(page.getByText(headline)).toBeVisible();
});

test("new worker is guided through the profile and publishes it", async ({ page, request }, testInfo) => {
  const email = `wizard-${testInfo.project.name}-${Date.now()}@example.com`;
  await page.goto("/en/auth/register");
  await page.getByLabel("Full name").fill("Levan Guided");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await page.goto(await confirmationLink(request, email));

  // Sign-up lands on the first step, and the profile is clearly not public yet.
  await expect(page).toHaveURL(/\/en\/dashboard\/profile\/basics$/);
  await expect(page.getByRole("link", { name: "Profile status: Hidden" })).toBeVisible();
  await expect(page.getByText("Your profile is hidden")).toBeVisible();

  // Any step can be skipped; publishing waits for the required ones.
  await page.getByRole("button", { name: /^Skip/ }).click();
  await expect(page).toHaveURL(/\/profile\/area$/);
  await page.goto("/en/dashboard/profile/review");
  await expect(page.getByRole("button", { name: "Publish profile" })).toBeDisabled();

  await page.goto("/en/dashboard/profile/area");
  await page.getByRole("button", { name: "Electrical" }).click();
  await page.getByRole("button", { name: "Tbilisi" }).click();
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expect(page.getByText("Saved. Your profile is still hidden.")).toBeVisible();
  await expect(page).toHaveURL(/\/profile\/contacts$/);

  await page.getByLabel("Phone").fill("+995555123456");
  await page.getByLabel("Phone").press("Enter");
  await expect(page).toHaveURL(/\/profile\/services$/);

  await expect(page.getByText("Ready to go live")).toBeVisible();
  await page.getByRole("button", { name: "Publish profile" }).click();
  await expect(page.getByText("Your profile is live!")).toBeVisible();
  await expect(page.getByRole("link", { name: "Profile status: Live" })).toBeVisible();
});
