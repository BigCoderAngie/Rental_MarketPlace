# RentLoop: what to build next, and how to ship it without breaking anything

Written 27 October 2026, after reading `main` (last merge: PR #22, icons not emojis), `docs/MASTER-PLAN.md`, `docs/TASKS.md`, `docs/SRS.md` and the build kit.

This plan has three parts:

1. **Safety first** (section 2): the setup that stops a change from breaking the live site. Do this once, before any new feature.
2. **The roadmap** (sections 3 to 8): your list, plus the extra features I found, in order. Each task is one branch and one pull request.
3. **Prompts** for Claude Code in VS Code, ready to paste (with each task, and in section 9).

---

## 1. Where the app is today

Some items on your list are already built or half built. The plan only covers what is left.

| Your item | State on `main` today | What is left |
|---|---|---|
| 1. Proper email sending | Not done. Supabase's built-in email still sends at most 2 emails an hour. | All of it. Task `email-sender-setup`. |
| 2. Up to 5 photos, step-by-step List an item | **Mostly done.** `/owner/list` has 3 steps, up to 5 photos (`MAX_PHOTOS` in `src/lib/listing.ts:10`) and shrinks photos on the phone (`src/components/photo-upload.tsx`). | The business inventory page (`/inventory/new`) still uses the old one-photo form. Task `add-item-flow` brings it in line. |
| 3. Phone number after first sign-in | **Half done.** Email sign-up already asks for a mobile number (`src/lib/signup.ts:34`). | Accounts made before that, and every Google sign-in, have no number. Task `finish-profile` catches them. |
| 4. Notifications and bell | Not done. | Tasks `db-notifications`, `notify-sender`, `notifications-ui`. |
| 5. Owner home dashboard | Individuals have `/owner`. Hire businesses still land on the calendar. | Task `home-dashboard`. |
| 6. Installable on phones | Not done (no `manifest`). | Part of `notifications-ui`. |
| 7. Offline checkout and return | Not done. | Task `offline-handover-forms`. |
| 8. Reviews | Not done ("No reviews yet" placeholder). | Tasks `db-reviews`, `reviews-ui`. |
| 9. Report a problem | Only the return dispute exists. | Tasks `db-problems`, `problems-staff-ui`, `problems-customer-ui`. |
| 10. Renter cancel or withdraw | Not done. | Tasks `db-customer-cancel`, `customer-cancel-ui`. |
| Saved items | Not done. | Task `saved-items`. |
| Share on WhatsApp | Not done on item pages. | Task `share-and-link-previews`. |
| Business profile (logo, hours, how to pay) | Database part done (`20261020000000_business_profile.sql`). Screen not done. | Task `settings-profile`. |
| Help and FAQ pages | `src/lib/faq.ts` exists for the home page. No help page. | Task `help-pages`. |
| Sign out in the header on wide screens | Missing. It is only in the phone menu (`src/components/site-menu.tsx`) and the staff sidebar. | Task `header-sign-out`. |

**Two notes on decisions.** The repo's master plan now says: sign in with **email and password** (with "email me a code" as a backup), and a **10% booking fee from day one** (Build kit decisions 1 and 3, 22 and 23 October). This plan follows the repo. If that has changed again, tell me and I'll update the plan.

**Every task below keeps the house rules:** no in-app chat (WhatsApp and Call only after the fee is paid), no "secure", "protected" or "guaranteed" anywhere (NFR-12), RentLoop never holds rental money (SRS 2.4), renters never pay a platform fee (SRS 1.3).

---

## 2. Safety first: how to stop anything breaking the app

Do this before new features. It takes about two evenings, and after that every change gets checked before real people see it.

### 2.1 The picture

```
your branch ──► pull request ──► GitHub checks (lint, types, tests, build, database rules)
                     │
                     └──► Vercel preview address (uses the TEST database)
                                 │  you click through it on your phone
                                 ▼
                         merge to main ──► Vercel production (uses the LIVE database)
```

- **Nothing reaches the live site without a pull request.** Every pull request gets its own preview address from Vercel.
- **Preview sites use a test database.** The live database holds real people's data, so previews never touch it.
- **New features hide behind a switch (a "feature flag")** until you turn them on. So half-finished work can merge without anyone seeing it.
- **If something breaks anyway,** Vercel puts the previous version back in one click ("Instant Rollback").

### 2.2 Two Supabase projects (free)

Supabase's free plan allows two projects. Use both:

| Project | Used by | Data |
|---|---|---|
| `rentloop-dev` (your current project) | your computer, Vercel previews, the demo | test data, safe to delete |
| `rentloop-live` (new) | the live Vercel site only | real users |

Free projects go to sleep after about a week with no visits. Section 2.8 keeps the live one awake.

The master plan already says to move to a separate production project and Vercel Pro **before the first paying business**, because Vercel's free plan doesn't allow commercial use. Doing the split now costs nothing and means you never have to move real users later.

### 2.3 Vercel set-up (task `deploy-vercel`)

1. Import the GitHub repo into Vercel. Production branch: `main`.
2. Environment variables. Vercel lets you set different values for **Production** and **Preview**:

| Variable | Production | Preview |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | rentloop-live | rentloop-dev |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | rentloop-live | rentloop-dev |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-site>.vercel.app` (or your domain) | leave empty (the app works it out, `src/lib/site-url.ts`) |
| `NEXT_PUBLIC_FLAG_*` (section 2.5) | only the features that are ready | all on |

3. In **each** Supabase project → Authentication → URL Configuration, add the redirect addresses, or sign-in links will fail on previews:
   - live: `https://<your-site>.vercel.app/**`
   - dev: `http://localhost:3000/**` and `https://*-<your-vercel-team>.vercel.app/**`
4. In Vercel → Settings → Deployment Protection, keep previews behind Vercel sign-in, so strangers can't find half-built pages. Share a preview with your boss with a "shareable link" from the preview's page.

### 2.4 GitHub set-up (once)

In GitHub → Settings → Branches → add a rule for `main`:
- Require a pull request before merging.
- Require the status checks **"Lint, typecheck, unit tests, build"** and **"Database rules"** to pass (they already exist in `.github/workflows/ci.yml`).
- Require branches to be up to date before merging.

Now a red check blocks the merge button, even for you.

### 2.5 Feature flags (task `feature-flags`)

A small file, `src/lib/flags.ts`, reads switches from environment variables:

```ts
// NEXT_PUBLIC_FLAG_GOOGLE_SIGNIN=on turns the Google button on.
export const flags = {
  googleSignIn: process.env.NEXT_PUBLIC_FLAG_GOOGLE_SIGNIN === "on",
  notifications: process.env.NEXT_PUBLIC_FLAG_NOTIFICATIONS === "on",
  // one line per feature
};
```

How you use it:
- A new feature merges **switched off** in Production and **on** in Preview.
- You test it on the preview address. When it's right, set the flag to `on` in Vercel Production and click Redeploy. No code change.
- If it misbehaves, set it back to `off` and Redeploy. That is faster and safer than reverting code.
- When a feature has been on for two weeks with no problems, a small clean-up PR removes its flag.

No new npm package is needed. (Vercel sells a flags product; you don't need it at this size.)

### 2.6 Database changes without breakage

Database mistakes are the ones you can't undo with a click, so they get the strictest rules. Your CLAUDE.md already says: a new migration file each time, RLS policies included, never edit an old file, and ask before `npx supabase db push`. Add these:

1. **Add, don't change.** A migration may add tables, columns, functions and policies. It must not rename or drop anything the current live code still uses. To rename, add the new thing, switch the code over in one release, and drop the old thing in a later migration ("expand, then contract").
2. **New columns are optional or have a default,** so the live code keeps working the moment the migration lands.
3. **Order:** push the migration to `rentloop-live` **first**, check the live site still works, **then** merge the code that uses it. Because of rule 1, the old code is happy with the new database.
4. **Back up before every live push:** `npx supabase db dump --linked -f backups/live-<date>.sql` (add `backups/` to `.gitignore`; never commit it, it contains people's data).
5. **Every migration ships with a database test** in `supabase/tests/` (CI already runs them).
6. **Only one migration per pull request**, with a comment at the top saying what it does in plain words (TASKS.md already asks for this).

A short release checklist, `docs/RELEASING.md` (task `release-checklist`), puts these rules in one place so Claude in VS Code follows them too.

### 2.7 Tests that click through the site (task `smoke-tests`, asks for a package)

Unit tests check logic. They don't notice that the sign-in page went blank. A handful of **smoke tests** in a real browser (Playwright) catch that:

- home page loads and shows items
- explore search returns results
- an item page opens on a 390 px phone
- sign up, sign in, sign out
- the List an item form reaches step 3
- a `/q` quote link and a `/b` booking link open without an account

They run on every pull request against the Vercel preview address. This needs `@playwright/test` as a new dev package, so CLAUDE.md says to ask you first. I recommend yes: it is the single best guard against "it worked on my machine".

### 2.8 Knowing when something is wrong

- **Error pages** (task `error-pages`): today a crash shows Next.js's plain error screen. Add `src/app/error.tsx`, `src/app/not-found.tsx` and `src/app/global-error.tsx` in RentLoop's look with a "Back to home" button and a WhatsApp link to you.
- **Uptime check:** a free UptimeRobot (or similar) check on the live site's home page every 5 minutes. It emails you when the site is down, and the visits keep the free Supabase project awake. Make the check hit a page that reads from the database (the home page does).
- **Vercel logs:** Vercel → your project → Logs shows server errors for free. Look after each release.
- **Later, optional:** Sentry's free plan sends you an email with the exact line when a page crashes. It's a new package, so it's a "decide later".

### 2.9 How every task flows

1. `git switch main && git pull`, then check for new migrations (CLAUDE.md already does this).
2. Paste the task's prompt into Claude Code. It plans, waits for your OK, builds, runs `/simplify` and `/code-review`, and runs the checks.
3. You say "commit", then "push and open a PR".
4. Open the PR's Vercel preview on your phone. Click through what changed.
5. If the task has a migration: back up, push it to the live database, check the live site, then merge.
6. Merge. If the feature has a flag, turn it on in Production when you're ready.

---

## 3. The order, at a glance

| Phase | Goal | Tasks (one PR each) |
|---|---|---|
| **0. Safety net** | Nothing breaks the live site | `deploy-vercel`, `release-checklist`, `feature-flags`, `error-pages`, `smoke-tests` |
| **1. Fix what people hit first** | Sign-up works for everyone, every time | `email-sender-setup`, `signup-bot-check`, `header-sign-out`, `finish-profile`, `google-sign-in`, `share-and-link-previews` |
| **2. Save owners time** | Owners don't have to keep checking | `db-notifications`, `notify-sender`, `notifications-ui` (bell + installable), `home-dashboard`, `offline-handover-forms`, `calendar-feed`, `listing-tools`, `add-item-flow` |
| **3. Trust** | Renters and owners trust each other | `db-customer-cancel`, `customer-cancel-ui`, `db-reviews`, `reviews-ui`, `db-problems`, `problems-staff-ui`, `problems-customer-ui`, `report-listing` |
| **4. Feels finished** | Small touches | `saved-items`, `settings-profile`, `owner-shop-page`, `help-pages`, `seo-basics`, `feedback-button`, `delete-my-account` |
| **5. Later, needs a decision first** | | PayToday live, SMS or WhatsApp sign-in, translations, weekly and weekend prices, bulk import, store apps, Apple sign-in, analytics |

Tasks named in `docs/TASKS.md` keep their names and contracts. New tasks are marked **New**.

---

## 4. Phase 0: the safety net

### `deploy-vercel` (in TASKS.md)
**What people see:** the site on a real web address your boss can open.
**Steps:** section 2.2 to 2.4. The task writes `docs/setup/vercel.md`; you do the clicking.
**SRS:** NFR-01. **Migration:** no (you run `db push` once on the new live project).

```
Do the task deploy-vercel from docs/TASKS.md, with these changes from docs/ROADMAP.md section 2:
two Supabase projects (rentloop-dev for my computer and Vercel previews, rentloop-live for production),
Production and Preview environment variables set separately, the Supabase redirect URLs for both,
and preview deployments kept behind Vercel sign-in. Write it as numbered click-by-click steps in docs/setup/vercel.md,
including how to apply all migrations to the new live project and how to roll back a bad deploy in Vercel.
Don't change app code. Plan first.
```

### `release-checklist` **New**
**What people see:** nothing. It writes the rules from section 2.6 and 2.9 into `docs/RELEASING.md`, and adds one line to CLAUDE.md pointing to it, so every future Claude session follows them.

```
Create docs/RELEASING.md from section 2.6 and 2.9 of docs/ROADMAP.md: the "add, don't change" migration rule,
the order (push the migration to the live database first, check the site, then merge), the backup command,
one migration per PR with a test, and the step-by-step release flow with Vercel previews and feature flags.
Add backups/ to .gitignore. Add one line under "Rules" in CLAUDE.md: "Follow docs/RELEASING.md for every
database change and every release." Show me the diff. No app code.
```

### `feature-flags` **New**
**What people see:** nothing yet. Later features hide behind these switches.

```
Add feature flags as described in docs/ROADMAP.md section 2.5.
- src/lib/flags.ts reads NEXT_PUBLIC_FLAG_<NAME> environment variables; "on" means on, anything else means off.
- src/lib/flags.test.ts covers on, off and missing.
- Add the flags to .env.example with a comment, all off.
- Add a "Feature flags" section to docs/RELEASING.md: how to turn one on in Vercel Production and redeploy,
  and that each flag is removed two weeks after it is on everywhere.
No new packages. Plan first.
```

### `error-pages` **New**
**What people see:** a friendly RentLoop page instead of a blank or technical error, with "Back to home" and "Tell us on WhatsApp".
**SRS:** NFR-08.

```
Add RentLoop-styled error pages, using the frontend-design skill and docs/DESIGN.md:
src/app/not-found.tsx ("We couldn't find that page"), src/app/error.tsx (something went wrong, a Try again
button that calls reset(), and Back to home), and src/app/global-error.tsx (the same, with its own html and body).
Read node_modules/next/dist/docs for how error.tsx and global-error.tsx work in this Next.js version first.
Use components from src/components/ui.tsx and icons from src/components/icons.tsx. Must work at 390 px.
Then /simplify, /code-review and the checks. Plan first.
```

### `smoke-tests` **New** (asks you for a package)

```
I want browser smoke tests with Playwright. Ask me before adding @playwright/test as a dev dependency.
Then add e2e/ tests for the list in docs/ROADMAP.md section 2.7, run at a 390 px phone size and at desktop size.
They take the site address from E2E_BASE_URL (default http://localhost:3000). Sign-up tests use
a throwaway email like e2e+<timestamp>@example.com and must refuse to run when E2E_BASE_URL is the live site.
Add "test:e2e" to package.json and a GitHub workflow that runs them against the Vercel preview address
of each pull request. Explain in plain words what I need to set in GitHub for that. Plan first.
```

---

## 5. Phase 1: fix what people hit first

### `email-sender-setup` (in TASKS.md) — do this first of all
**What people see:** sign-up confirmations, sign-in codes and password resets arrive within a minute, even when 20 people sign up on the same day.
**Why:** Supabase's built-in sender allows 2 emails an hour. That's 2 sign-ups an hour.
**Choice:** Resend or Brevo, both free. Resend is simpler to set up; Brevo's free plan allows more emails a day. Either is fine at your size. You need a domain you control (for example `rentloop.com.na`) to send from; a `.vercel.app` address can't send email.
**Also:** put RentLoop's look on Supabase's email templates (Confirm sign-up, Magic link / code, Reset password), with plain wording and no "secure".
**SRS:** FR-AC-01. **Migration:** no.

```
Do the task email-sender-setup from docs/TASKS.md.
Write docs/setup/email.md as click-by-click steps for Resend (and a short Brevo alternative):
verify my domain with the DNS records, create an SMTP key, put it in Supabase → Authentication → SMTP for
BOTH projects (rentloop-dev and rentloop-live), and raise the email rate limit in Supabase.
Also write the three Supabase email templates (confirm sign-up, sign-in code, reset password) as HTML in
supabase/templates/, in RentLoop's colours from docs/DESIGN.md, short plain wording, no "secure",
"protected" or "guaranteed", and wire them into supabase/config.toml for local use.
Then tell me how to check it: 5 sign-in codes in a row arrive within a minute each. Plan first.
```

### `signup-bot-check` **New**
**What people see:** a small "I'm human" check (Cloudflare Turnstile, free, usually invisible) on sign-up and "email me a code".
**Why:** with a real email sender, a bot filling the sign-up form could burn your free email allowance in minutes and get your domain marked as spam. Supabase supports Turnstile out of the box.
**SRS:** NFR-05. **Migration:** no. **Flag:** `NEXT_PUBLIC_FLAG_BOT_CHECK`.

```
Add Cloudflare Turnstile to sign-up, sign-in and "email me a code", using Supabase Auth's built-in captcha support
(captchaToken on signUp, signInWithPassword and signInWithOtp). Read the current files first:
src/app/signin/actions.ts, the sign-up actions, and src/components/signup-pages.tsx.
Load the Turnstile script only on those pages, without an npm package. Hide it behind
NEXT_PUBLIC_FLAG_BOT_CHECK from src/lib/flags.ts. Write docs/setup/bot-check.md: create the Turnstile site,
put the secret in Supabase → Authentication → Attack Protection for both projects, and the site key in Vercel.
The form must still work at 390 px and with keyboard only. Plan first.
```

### `header-sign-out` **New**
**What people see:** on a laptop, the avatar opens a small menu: My bookings, Owner dashboard (if they list), Settings, Sign out.
**SRS:** NFR-08. **Migration:** no.

```
On screens 1024 px and wider, signed-in people have no way to sign out from the public header
(src/components/site-header.tsx). Turn the avatar into a menu button that opens a small menu:
My bookings, Owner dashboard (only if they list items), and Sign out (posting to src/app/auth/signout/route.ts).
Use the frontend-design skill, existing parts from src/components/ui.tsx, icons from src/components/icons.tsx.
It must open and close with the keyboard and Escape, and close when clicking outside. Keep phones unchanged.
Then /simplify, /code-review and the checks. Plan first.
```

### `finish-profile` **New** (your item 3)
**What people see:** anyone who signs in without a phone number (older accounts, and Google sign-ins from the next task) gets one short page first: "Add your mobile number" (plus town and the Terms tick if they never gave them). Then they continue where they were going.
**Why:** WhatsApp and Call after a booking need a number on both sides (FR-PV-01).
**SRS:** FR-AC-01 (changed), FR-AC-05 (NEW → ACTIVE through `set_my_phone`). **Migration:** probably no (`profiles` and `set_my_phone` exist); Claude checks.

```
Add a "Finish your profile" page at /signup/finish for signed-in people whose profile has no phone number,
no town, or no Terms tick. It asks only for what is missing, then sends them to ?next= or their usual home
(homeAfterSignIn in src/lib/business.ts).
- Reuse the mobile number check from src/lib/signup.ts and the town list and Terms box from the About you step.
- Save the phone with set_my_phone (C1 in docs/TASKS.md) so the account moves from NEW to ACTIVE.
- In src/proxy.ts, send signed-in people with a missing phone to this page before any page that needs an account.
  Public pages, /auth/*, /q and /b links and sign out must keep working.
- Logic and the "what's missing" check in src/lib/finish-profile.ts with tests.
Check the SRS IDs and tell me if this needs a migration. Plan first.
```

### `google-sign-in` **New** (you asked for this)
**What people see:** "Continue with Google" on Sign in and Sign up. One tap, no password to remember. First-time Google users then see "Finish your profile" for their phone number, town and the Terms tick.
**Why it helps:** most people in Namibia have a Google account on their Android phone. It also takes load off your email sender, because Google sign-ins need no confirmation email.
**Things to know:**
- If someone already signed up with the same email, Supabase links the Google login to the same account. Nobody ends up with two accounts.
- Google's sign-in screen will say "continue to `<your-project>`.supabase.co" unless you pay Supabase for a custom domain. Setting the app name and logo on Google's consent screen helps.
- It needs Google's consent screen to point at your Privacy page (`/privacy` exists) and Terms page.
- This changes FR-AC-01 (email login for the MVP). Add it to MASTER-PLAN.md "Changes to the SRS".
**SRS:** FR-AC-01 (changed). **Migration:** no. **Flag:** `NEXT_PUBLIC_FLAG_GOOGLE_SIGNIN`. Needs `finish-profile` first.

```
Add "Continue with Google" to /signin and /signup, using Supabase Auth's Google provider
(signInWithOAuth, redirecting to the existing src/app/auth/callback/route.ts, which already exchanges the code).
- Keep ?next= working through the Google round trip (safeNextPath in src/lib/signup.ts).
- New Google users go to /signup/finish (from the finish-profile task) before anything else.
- Fill the profile's full name from Google's name if it is empty.
- Hide the button behind NEXT_PUBLIC_FLAG_GOOGLE_SIGNIN from src/lib/flags.ts.
- The Google button follows Google's button rules (white, Google "G" as an SVG in src/components/icons.tsx).
- Write docs/setup/google-signin.md: create the OAuth client in Google Cloud, the consent screen (app name RentLoop,
  logo, /privacy and /terms links), the redirect URL for each Supabase project, and turning on Google in both.
- Add "FR-AC-01: Google sign-in added for the MVP" to "Changes to the SRS" in docs/MASTER-PLAN.md.
Use the frontend-design skill for the button. Plan first.
```

### `share-and-link-previews` **New** (your "Share on WhatsApp", made stronger)
**What people see:** a "Share" button on every item page. On phones it opens the phone's share sheet (WhatsApp, Facebook, SMS); on laptops it opens WhatsApp with the link. **And** when anyone pastes an item link into WhatsApp, the chat shows a preview card with the item's photo, name, "N$ 250 / day" and town, instead of a bare link.
**Why:** links with a photo get tapped far more. This is the cheapest way to bring renters in, because owners will share their own items.
**SRS:** FR-SR-04, NFR-02. **Migration:** no. Contact details never appear in the preview (FR-PV-01).

```
Make item links share well on WhatsApp.
1. On /items/[id], add a Share button: navigator.share where the phone supports it, otherwise a wa.me link
   built with src/lib/whatsapp.ts. Text: "<item name>, N$ <price> a day in <town> on RentLoop: <link>".
2. Add generateMetadata to the item page with title, description and an Open Graph image, so WhatsApp, Facebook
   and SMS show a preview card. Use the item's cover photo; if it has none, make one with Next's opengraph-image
   (item name, price with formatNad, town, RentLoop logo, our colours). Never include the owner's name, street,
   phone or email (FR-PV-01). Read node_modules/next/dist/docs about metadata and opengraph-image first.
3. Do the same preview for the home page and /explore.
Logic (the share text) in src/lib/share.ts with tests. Use the frontend-design skill. Plan first.
```

---

## 6. Phase 2: save owners time

These follow the contracts already written in `docs/TASKS.md` (C5 notifications). Only the extras are new.

### `db-notifications`, `notify-sender`, `notifications-ui` (in TASKS.md, C5)
**What people see:** a bell with an unread count. A new booking request also arrives as a phone notification and an email within a minute. "Add RentLoop to your home screen" makes it open like an app.
**Add to the contract:**
- Renters get notifications too, not only owners: "Your request was accepted", "declined", "expired", "your rental starts tomorrow". The C5 contract was written before renters had accounts.
- A "Notifications" section in settings where each person turns email off per kind. Push and the bell stay.
- Notification text never contains the other side's phone or email before the fee is paid.
- On iPhone, push only works after "Add to Home Screen". The install prompt says so in plain words.
**Flag:** `NEXT_PUBLIC_FLAG_NOTIFICATIONS`. **Migration:** yes, one, in `db-notifications`.

```
Do the task db-notifications from docs/TASKS.md (contract C5), with these additions from docs/ROADMAP.md section 6:
renters get notifications too (request accepted, declined, expired, rental starts tomorrow) for listing_requests
and marketplace bookings, and a notification_settings table where each user turns email off per kind.
Follow docs/RELEASING.md: one migration, add-only, with a test in supabase/tests/notification_rules.sql.
Plan first and show me the updated contract before writing SQL.
```
Then, one at a time: `Do the task notify-sender from docs/TASKS.md.` and `Do the task notifications-ui from docs/TASKS.md, behind NEXT_PUBLIC_FLAG_NOTIFICATIONS, including the install prompt from docs/ROADMAP.md section 6.`

### `home-dashboard` (in TASKS.md)
**What people see:** hire businesses land on a Home page: today's checkouts and returns, money recorded this month, new requests, the next bookings. One screen.

```
Do the task home-dashboard from docs/TASKS.md. Individuals keep /owner; make sure both dashboards share the
same stat cards and "today" logic (src/lib/today.ts) instead of duplicating it. Plan first.
```

### `offline-handover-forms` (in TASKS.md)
```
Do the task offline-handover-forms from docs/TASKS.md. Save drafts in the browser's localStorage, wrapped in
try/catch, keyed by booking id, and clear the draft after a successful submit. Show "Saved on this phone" when a
draft exists and "No connection" on the submit button while offline. Plan first.
```

### `calendar-feed` **New**
**What people see:** in Settings, "Add bookings to your phone's calendar". The owner taps it once, and every confirmed booking (checkout and return times, item, renter's first name) shows in Google Calendar or the iPhone calendar, and stays up to date.
**Why:** owners already live in their phone calendar. Free, no package (a calendar feed is plain text).
**SRS:** FR-CA-04. **Migration:** yes (a secret feed token per member, which can be reset).

```
Add a private calendar feed for owners and staff. Each member gets a secret feed address
/cal/<token>.ics that Google Calendar and iPhone Calendar can subscribe to. It lists confirmed and checked-out
bookings for their business: checkout and return as events, items and quantities, the renter's first name only.
- Migration: a calendar_feed_tokens table (one per member, can be reset), RLS so people see only their own,
  and a function that returns the events for a token. Test in supabase/tests/.
- The .ics text is built in src/lib/ical.ts with tests (dates in Africa/Windhoek, escaping commas and new lines).
- Settings gets "Add to my calendar" with copy, open-in-Google and reset buttons.
Follow docs/RELEASING.md. No new packages. Plan first.
```

### `listing-tools` **New**
**What people see:** on each of their listings, owners can **Pause** it (hidden from search, for holidays or when they're using it themselves), **Block dates** (not available on those days), and **Duplicate** it (to list a second similar item fast).
**Why:** individuals need to say "not this weekend" without deleting their listing. Today they can't.
**SRS:** FR-IN-04, FR-CA-01. **Migration:** yes. If `db-units-out` (C3) is done first, "Block dates" can reuse its repair entries for individuals.

```
Add three listing tools for owners on /owner and the item edit page:
1. Pause and resume a listing (hidden from /explore and the item page says "Not available right now").
2. Block dates: the owner picks a date range when the item is not available; search and requests treat those
   days as fully booked. If the units-out task (C3 in docs/TASKS.md) is merged, reuse item_units_out;
   otherwise tell me and we'll do C3 first.
3. Duplicate a listing (copies everything except photos, opens the edit form).
Tests for the database rules and for the logic in src/lib. Follow docs/RELEASING.md. Plan first.
```

### `add-item-flow` (in TASKS.md)
Brings the business inventory's add item page in line with the 5-photo owner form.
```
Do the task add-item-flow from docs/TASKS.md. Reuse the photo upload and the steps already built for
/owner/list (src/components/photo-upload.tsx, src/components/listing-form.tsx, src/lib/listing.ts) rather than
building a second version. Check db-item-photos (C2) is merged first. Plan first.
```

---

## 7. Phase 3: trust between renters and owners

These are all in `docs/TASKS.md` with contracts (C6, C7, C8). Two changes since they were written:
- The marketplace now has renter accounts, so renters act from **My bookings** as well as from the `/b` link.
- Reviews are now **shown publicly** on item pages (master plan "Build kit decisions" 11 and Parts 5 to 10, 7), from completed bookings only.

| Task | What people see |
|---|---|
| `db-customer-cancel`, `customer-cancel-ui` | Renters cancel a confirmed booking or withdraw a request, with a reason, until checkout. If they paid anything: "Contact the owner about a refund" (RentLoop holds no money, 2.4). The owner gets a notification. |
| `db-reviews`, `reviews-ui` | After a booking closes, both sides rate each other (stars and a sentence) within 14 days. The item page shows the average and the reviews. |
| `db-problems`, `problems-staff-ui`, `problems-customer-ui` | Either side reports damage, missing items, a no-show or a dispute, with photos. The owner answers, marks it settled with an outcome, and the renter accepts it or reopens it once. |
| `report-listing` **New** | A small "Report this listing" link on item pages (fake, wrong category, not allowed). Reports go to the admin page. |

Prompt pattern for each (one at a time, database task first):
```
Do the task db-customer-cancel from docs/TASKS.md (contract C6). Since it was written, renters have accounts
and "My bookings" (/my/bookings). Update the contract so renters can cancel or withdraw from My bookings too,
not only the /b link, and show me the updated contract before writing SQL. Follow docs/RELEASING.md.
```
```
Do the task db-reviews from docs/TASKS.md (contract C8). Since it was written, the master plan shows reviews
publicly on item pages from completed bookings only. Add a public read function for an item's reviews and
average rating (no renter surnames, phones or emails), and update the contract first. Follow docs/RELEASING.md.
```
```
Do the task db-problems from docs/TASKS.md (contract C7), covering marketplace bookings as well as business
bookings, with renters reporting from My bookings and the /b link. Update the contract first. Follow docs/RELEASING.md.
```
```
Add "Report this listing" to /items/[id]: a reason (fake or misleading, not allowed, wrong category, other) and an
optional note, for signed-in people only, once per person per listing. Migration: listing_reports with RLS
(reporters insert only, admins read). Show open reports on the admin page with "Hide listing" and "Dismiss".
Follow docs/RELEASING.md. Plan first.
```

---

## 8. Phase 4: small touches that make it feel finished

### `saved-items` **New** (your item)
**What people see:** a heart on item cards and item pages. Tapping it while signed out asks them to sign in, then saves. "Saved" appears in the account menu.
**SRS:** not in the SRS; an addition (add a line to MASTER-PLAN.md). **Migration:** yes (`saved_items`, own rows only).
```
Add saved items for renters: a heart button on item cards (/explore, home) and item pages, and a Saved page at
/my/saved. Signed-out taps go to /signin?next=<this page> and save after sign-in. Migration: saved_items
(user_id, item_id, created_at) with RLS so people see only their own, and a test. Paused or deleted items show as
"No longer available". Record the addition in docs/MASTER-PLAN.md. Heart icon as an SVG in src/components/icons.tsx.
Follow docs/RELEASING.md and use the frontend-design skill. Plan first.
```

### `settings-profile` (in TASKS.md, your "business profile")
```
Do the task settings-profile from docs/TASKS.md (contract C1, database part already merged). Plan first.
```

### `owner-shop-page` **New**
**What people see:** every owner gets a public page, `/o/<their-name>`, with their name, town, logo, opening hours, rating, and all their listings. A hire business can put this one link in their WhatsApp status, Facebook page and Google Maps listing.
**Why:** businesses already have customers. This gives them a reason to send those customers to RentLoop, which brings renters in for free.
**Privacy:** shows the business name and town only. No phone, email or street before a paid booking (FR-PV-01). Individuals show first name and town.
**SRS:** FR-SR-04, FR-AC-02. **Migration:** yes (a unique `slug` on businesses).
```
Add a public owner page at /o/[slug]: business name (individuals: first name), town, logo, opening hours,
rating once reviews exist, and their listed items as cards. No phone, email or street (FR-PV-01).
Migration: a unique slug on businesses, filled from the name for existing rows, editable in Settings, with a test.
Add "Share your page" on /owner using the share helper from src/lib/share.ts, and an Open Graph preview.
Follow docs/RELEASING.md and use the frontend-design skill. Plan first.
```

### `help-pages` **New** (your item)
**What people see:** `/help` with short answers, grouped for renters and owners. Every answer is one or two sentences.
Suggested questions:
- How do I rent something? / How do I list something?
- How does the 10% booking fee work? Who pays it? (The owner, when they accept. Renters never pay RentLoop.)
- How do I pay the owner? (Directly, as the owner's payment details say. RentLoop doesn't take or hold the money.)
- What about the deposit? (Agreed with the owner, paid to the owner, returned by the owner.)
- What if something breaks or goes missing? (Report a problem from My bookings, with photos.)
- When do I see the owner's phone number? (After the owner accepts and pays the booking fee.)
- How do I cancel? Can I get the fee back? (Fee refund rules from MASTER-PLAN Parts 5 to 10, 4.)
- Which towns and categories? (Windhoek, Swakopmund, Walvis Bay; the six categories.)
- How do I delete my account?
```
Add a Help page at /help with the questions in docs/ROADMAP.md section 8, split into "Renting" and "Listing",
as short plain answers. Keep the answers in src/lib/faq.ts (extend it, with tests that no answer uses
"secure", "protected" or "guaranteed"). Check every answer against docs/MASTER-PLAN.md and docs/SRS.md and
list any you are unsure of. Link Help from the footer and the account menu. Use the frontend-design skill. Plan first.
```

### `seo-basics` **New**
**What people see:** RentLoop items show up when someone Googles "tent hire Windhoek".
**What it adds:** `sitemap.xml`, `robots.txt` (keeping `/owner`, `/my`, `/q`, `/b`, `/admin` out of Google), a title and description on each page, and town and category pages (`/hire/windhoek/events`).
```
Add search engine basics: src/app/sitemap.ts (home, explore, help, item pages, owner pages, town and category
pages), src/app/robots.ts (block /owner, /my, /q, /b, /admin, /auth, /signup, /signin), titles and descriptions on
public pages, and town-and-category landing pages at /hire/[town]/[category] that reuse the explore results.
Read node_modules/next/dist/docs about sitemap, robots and metadata first. Plan first.
```

### `feedback-button` **New**
**What people see:** a small "Feedback" link in the footer and account menu. People type what went wrong or what they want, and it lands on your admin page with the page address and their phone type.
**Why:** while your boss and the first owners try it, you want every complaint in one place, not scattered across WhatsApp.
```
Add a Feedback form at /feedback (linked from the footer and account menu): a message, an optional "you can
contact me" tick, and the page they came from and their browser filled in automatically. Signed-out people can use it,
limited to 5 a day per person. Migration: a feedback table, insert only for everyone, read only for admins, with a test.
Show it on the admin page newest first. Follow docs/RELEASING.md. Plan first.
```

### `delete-my-account` **New**
**What people see:** Settings → "Delete my account". It explains what is kept and why, then removes their personal details.
**Why:** NFR-07 asks for personal data to be removed on closing an account, Google requires a deletion path for sign-in apps, and it builds trust. Booking, payment and handover records stay 5 years (NFR-07), with the person's name replaced.
```
Add "Delete my account" to the account settings. Explain in plain words what is removed (name, phone, email,
photos of them, saved items) and what is kept for 5 years with their name replaced (bookings, payments,
checkout and return records, as NFR-07 says). Refuse while they have a booking that is confirmed or checked out,
and say why. An owner of a hire business with staff must hand it over or close it first.
Database function that anonymises and moves the account state to CLOSED (FR-AC-05), with tests; then sign out.
Follow docs/RELEASING.md. Plan first and list every table that holds personal data.
```

---

## 9. Phase 5: later, each needs a decision first

| Idea | Why it's useful | What has to be decided |
|---|---|---|
| **PayToday live** | Booking fee paid for real; today it's test mode. | PayToday account and keys; lawyer's check on the fee model (SRS 8). |
| **Mobile code sign-in (SMS)** | People without email. The kit's "Mobile code" tab is built and switched off. | Which SMS provider and its price. |
| **Weekly and weekend prices, minimum days** | Common in hire; a week usually costs less than 7 days. | Price rules, and how they show on quotes. |
| **Bulk import (CSV)** | A hire business with 80 item types lists them in minutes. | Template columns; photos added afterwards. |
| **Delivery fee per item** | Many hire businesses deliver tents and chairs. | Fixed fee or per km; SRS 8 says businesses handle delivery. |
| **Translations** (Afrikaans, Oshiwambo) | NFR-09, after the MVP. | Who translates. |
| **App Store and Google Play** | The buttons say "Coming soon". The installable web app covers most of this first. | Whether it's worth it once the web app is installable. |
| **Apple sign-in** | Only required if an iPhone store app offers Google sign-in. | Comes with the store apps. |
| **Visitor stats** | See where people give up during sign-up. Vercel's free Web Analytics does this without cookies. | It's a new package (`@vercel/analytics`). |
| **Error emails (Sentry)** | An email with the exact line when a page crashes. | It's a new package. |
| **Owner response time** | "Usually answers within 2 hours" on item pages builds trust. | Needs some weeks of real requests first. |

---

## 10. How to start in VS Code

**Step 1. Put this plan in the repo** (one small PR, so every future session can read it):

```
Copy the plan I give you into docs/ROADMAP.md exactly as it is. Then add a section "Roadmap tasks (27 Oct 2026)"
at the top of docs/TASKS.md that lists every task from docs/ROADMAP.md section 3 in that order, unticked,
with one line each: the task name, "New" or "in TASKS.md below", and the SRS IDs. Don't change the existing waves.
Show me the diff. Don't commit until I say so.
```
(Attach or paste this file after that prompt.)

**Step 2. Do the safety net,** in this order: `deploy-vercel`, `release-checklist`, `feature-flags`, `error-pages`, `smoke-tests`.

**Step 3. Then Phase 1 in order.** `email-sender-setup` comes before `google-sign-in`, and `finish-profile` comes before `google-sign-in`.

**After that,** for any task the prompt can be just:
```
Do the next unticked task in the "Roadmap tasks" list in docs/TASKS.md, using its prompt in docs/ROADMAP.md.
```

**Tips:**
- `/clear` between tasks. The docs carry the context, not the chat.
- One task per branch, named after the task (`git switch -c google-sign-in`).
- After each merge: `git switch main && git pull`, and Claude checks for new migrations.
- Show your boss the Vercel preview of anything big before it merges. Ask what they'd use first, and move that task up.
