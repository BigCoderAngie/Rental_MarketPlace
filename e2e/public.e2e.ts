import { expect, test } from "@playwright/test";
import { visible } from "./helpers";

// Pages anyone can open without an account. Safe to run against the live site.

test("home page loads with search and items", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/RentLoop/);
  await expect(page.getByRole("heading", { level: 1, name: /items? in / })).toBeVisible();
  await expect(visible(page.getByRole("searchbox"))).toBeVisible();
});

test("explore search returns a results page", async ({ page }) => {
  await page.goto("/explore");
  const search = visible(page.getByRole("searchbox"));
  await search.fill("tent");
  await search.press("Enter");
  await expect(page).toHaveURL(/[?&]q=tent/);
  await expect(page.getByRole("heading", { level: 1, name: /items? in / })).toBeVisible();
});

test("an item page opens and fits the screen", async ({ page }) => {
  await page.goto("/explore?town=Anywhere");
  const firstItem = page.locator('a[href^="/items/"]').first();
  test.skip((await firstItem.count()) === 0, "No items listed on this site yet");

  await firstItem.click();
  await expect(page).toHaveURL(/\/items\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("/ day").first()).toBeVisible();
  // Nothing sticks out sideways (390 px phones in the phone run).
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const link of ["/q/smoke-test", "/b/smoke-test"]) {
  test(`${link.slice(0, 3)} links open without an account`, async ({ page }) => {
    await page.goto(link);
    // An unknown link shows "not found" instead of sending people to sign in.
    await expect(page).toHaveURL(new RegExp(`${link}$`));
    await expect(page.getByRole("heading", { level: 1, name: "We couldn't find that page" })).toBeVisible();
  });
}
