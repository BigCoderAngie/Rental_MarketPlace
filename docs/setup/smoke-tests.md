# Smoke tests (Playwright)

Task `smoke-tests` (docs/ROADMAP.md 2.7). Unit tests check logic; these open the site in a real browser and click through it, so "the sign-in page went blank" gets caught before people see it. Each test runs twice: on a 390 px phone and on a desktop screen.

| Test | File | Needs |
|---|---|---|
| Home page loads with search and items | `e2e/public.e2e.ts` | nothing |
| Explore search returns a results page | `e2e/public.e2e.ts` | nothing |
| An item page opens and fits the screen | `e2e/public.e2e.ts` | at least one item (skips otherwise) |
| `/q` and `/b` links open without an account | `e2e/public.e2e.ts` | nothing |
| Sign in and sign out | `e2e/account.e2e.ts` | the test account |
| List an item reaches step 3 (nothing is saved) | `e2e/account.e2e.ts` | the test account |
| Sign up reaches "Check your email" | `e2e/account.e2e.ts` | `E2E_SIGNUP=on` (off by default) |

**The account tests never run on the live site.** They skip themselves there, so the live database only ever gets visitors who just look.

The sign-up test is off by default because every run sends a real confirmation email, and the dev project sends only 2 emails an hour (until `email-sender-setup`).

## Run them on your computer

```powershell
cd "C:\Dev\Rental Market\Rental_MarketPlace"
npx playwright install chromium   # once, downloads the test browser
npm run test:e2e
```

This starts the site on your computer if it isn't running. To test another address, for example the live site (public tests only):

```powershell
$env:E2E_BASE_URL = "https://rental-market-place-ochre.vercel.app"
npm run test:e2e
Remove-Item Env:E2E_BASE_URL
```

To include the account tests, set `E2E_EMAIL` and `E2E_PASSWORD` the same way first.

## On GitHub (automatic)

`.github/workflows/smoke.yml` runs the tests every time Vercel finishes a deployment: each pull request's preview, and the live site after a merge. The result shows on the pull request as **Smoke tests (Preview)**. If it fails, open it → **Summary** → download **playwright-report** to see screenshots.

It isn't one of the checks that must pass before merging. Once it has been reliable for a few weeks you can add it in **Settings → Rules → Protect main**.

### What you set up once

**1. Let the tests past Vercel's sign-in wall.** Preview addresses ask for a Vercel login; the tests need a key to get through.

1. Vercel → project **rental-market-place** → **Settings → Deployment Protection**.
2. Under **Protection Bypass for Automation**, click **Add Secret** (leave the value empty to get a random one) → **Save**.
3. Copy the secret.
4. GitHub → **code4namibia/Rental_MarketPlace** → **Settings → Secrets and variables → Actions → New repository secret**.
   Name: `VERCEL_AUTOMATION_BYPASS_SECRET`, Secret: paste it → **Add secret**.

Without this, the preview tests fail at the first page (they see Vercel's login instead).

**2. Make a test account on the dev project.** Previews use the dev database, so the account goes there, not on the live site.

1. Open any preview link (or the site on your computer) and sign up with an email you can open. A Gmail trick: `yourname+e2e@gmail.com` arrives in your normal inbox but counts as a separate account.
2. Confirm the email, then press **List an item** once and finish **Before you list**. Don't publish an item.
3. In GitHub secrets (same place as above), add `E2E_EMAIL` and `E2E_PASSWORD` with that account's email and password.

Without these, the account tests skip and the rest still run.
