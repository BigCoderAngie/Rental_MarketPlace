import { expect, type Page } from "@playwright/test";

// Shared bits for the smoke tests (docs/setup/smoke-tests.md).

/** Addresses of the live site. Tests that make accounts refuse to run there. */
const LIVE_HOSTS = ["rental-market-place-ochre.vercel.app"];

export function isLiveSite(baseURL: string | undefined): boolean {
  if (!baseURL) return false;
  const host = new URL(baseURL).hostname;
  return LIVE_HOSTS.includes(host) || (process.env.E2E_LIVE_HOST ?? "") === host;
}

/** A test account on the dev Supabase project, from E2E_EMAIL and E2E_PASSWORD. */
export function testAccount(): { email: string; password: string } | null {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  return email && password ? { email, password } : null;
}

/** The first of several matching elements that is on screen (phones and desktop show different copies). */
export function visible<T extends ReturnType<Page["locator"]>>(locator: T): T {
  return locator.filter({ visible: true }).first() as T;
}

/** Waits for the "I'm human" box, when the site shows one, to put its token in the form. */
export async function waitForBotCheck(page: Page) {
  const token = page.locator('input[name="captchaToken"]');
  if ((await token.count()) === 0) return;
  await expect(token.first()).not.toHaveValue("", { timeout: 20_000 });
}

export async function signIn(page: Page, account: { email: string; password: string }) {
  await page.goto("/signin");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: false }).first().fill(account.password);
  await waitForBotCheck(page);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/signin/);
}

/** Signs out from the public header: the account menu on wide screens, the Menu on phones. */
export async function signOut(page: Page) {
  await page.goto("/");
  const accountButton = page.getByRole("button", { name: /^Your account/ });
  if (await accountButton.isVisible()) await accountButton.click();
  else await visible(page.getByRole("button", { name: "Menu", exact: true })).click();
  await visible(page.getByRole("button", { name: "Sign out" })).click();
  await expect(visible(page.getByRole("link", { name: "Sign in", exact: true }))).toBeVisible();
}
