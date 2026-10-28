import { expect, test } from "@playwright/test";
import { isLiveSite, signIn, signOut, testAccount, visible, waitForBotCheck } from "./helpers";

// Sign up, sign in, sign out and List an item. These need a test account on
// the dev project and never run against the live site (docs/setup/smoke-tests.md).

test.beforeEach(({ baseURL }) => {
  test.skip(isLiveSite(baseURL), "Account tests don't run on the live site");
});

test("sign up reaches check your email", async ({ page }) => {
  // Each run sends a real confirmation email, and the dev project sends only a few an hour.
  test.skip(process.env.E2E_SIGNUP !== "on", "Set E2E_SIGNUP=on to run the sign-up test");

  const stamp = Date.now();
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Smoke Test");
  await page.getByLabel("Email address").fill(`e2e+${stamp}@example.com`);
  await page.getByLabel("Mobile number").fill(`81 ${String(stamp).slice(-7, -4)} ${String(stamp).slice(-4)}`);
  await page.getByLabel("Password", { exact: false }).first().fill("smoke-test-password");
  await page.getByLabel("Confirm password").fill("smoke-test-password");
  await visible(page.getByRole("button", { name: "Next" })).click();

  await page.getByRole("checkbox", { name: /I agree to the/ }).check({ force: true });
  await waitForBotCheck(page);
  await visible(page.getByRole("button", { name: "Create my account" })).click();
  await expect(page).toHaveURL(/\/signup\/check-email|\/welcome/);
});

test.describe("with the test account", () => {
  test.beforeEach(() => {
    test.skip(!testAccount(), "Set E2E_EMAIL and E2E_PASSWORD to run the signed-in tests");
  });

  test("sign in and sign out", async ({ page }) => {
    await signIn(page, testAccount()!);
    await signOut(page);
  });

  test("List an item reaches step 3", async ({ page, isMobile }) => {
    await signIn(page, testAccount()!);
    await page.goto("/owner/list");
    expect(page.url(), "Finish \"Before you list\" for the test account first").not.toMatch(/\/owner\/setup/);
    await expect(page.getByText("What are you renting out?")).toBeVisible();

    if (isMobile) {
      // Phones: one step at a time.
      await page.locator('input[name="category"]').first().check({ force: true });
      await page.getByRole("button", { name: "Continue to details" }).click();
      await expect(page.getByText("Step 2 of 3")).toBeVisible();
      await page.getByLabel("Title").fill("Smoke test tent");
      await page.getByRole("button", { name: "Continue to photos" }).click();
      await expect(page.getByText("Step 3 of 3")).toBeVisible();
    } else {
      // Desktop: all three steps on one page.
      await expect(page.getByLabel("Area renters collect from")).toBeVisible();
    }
    // Nothing is saved: the test leaves without pressing Save or Publish.
    await signOut(page);
  });
});
