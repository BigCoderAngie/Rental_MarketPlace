# RentLoop tasks

The MVP from `docs/MASTER-PLAN.md`, split into waves. Each task is one branch from `main` with the same name, and one pull request. Start a task with "Do the next unticked task in docs/TASKS.md", and tick it off in the same PR.

## Rules

- Tasks in the same wave can run at the same time. No two tasks in a wave change the same file.
- A wave adds at most one migration.
- Where a screen task and a database task share a wave, the **contract** below fixes the function names, inputs and TypeScript types first. The database task only touches `supabase/`. The screen task writes the types from the contract.
- **Sample data:** a screen task may build against sample data while its database task is in progress. The sample data lives in one file per screen (for example `sample-profile.ts` next to the page), typed by the contract. The screen task merges **only after** its database task, and swaps the sample data for the real query in the same PR, so no sample data ever reaches `main`.
- **Done for every task:** `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass. Screen tasks add phone (390 px) and desktop screenshots to the PR and follow `docs/DESIGN.md`. Database tasks add a test in `supabase/tests/` that passes with `npm run test:db`, and a comment at the top of the migration saying what it does.
- Every task follows `CLAUDE.md`: name the SRS IDs, plan first, `/simplify`, `/code-review`.

---

## Wave 1: shared parts and the business profile

### Contract C1: business profile and account states

Database (`db-business-profile`):
- `businesses` gets `logo_path text`, `opening_hours text`, `bipa_number text`, `payment_details text` (how customers pay: bank and eWallet details). Owners update them through the existing update policy.
- New public bucket `business-logos`; paths start with the business id (like `item-photos`).
- New type `account_state` = `NEW`, `PHONE_VERIFIED`, `ACTIVE`, `UNDER_REVIEW`, `SUSPENDED`, `CLOSED`. New table `profiles (user_id uuid primary key references auth.users, phone text, account_state account_state not null default 'NEW', created_at)`, one row per user, created on sign-up. Users read and update only their own row; `account_state` is changed only by functions.
- `set_my_phone(p_phone text) returns void`: saves the phone and moves `NEW` to `ACTIVE`.
- `get_public_booking(p_token)` and `get_public_quote(p_token)` return `business.payment_details` and `business.logo_path`. Nothing else reads `payment_details` for customers.

TypeScript (in `src/lib/types.ts`, written by `settings-profile`):
```ts
export type AccountState = "NEW" | "PHONE_VERIFIED" | "ACTIVE" | "UNDER_REVIEW" | "SUSPENDED" | "CLOSED";
export type BusinessProfile = { logo_path: string | null; opening_hours: string | null; bipa_number: string | null; payment_details: string | null };
export type Profile = { user_id: string; phone: string | null; account_state: AccountState };
// Business gains BusinessProfile's fields; PublicQuote["business"] gains logo_path and payment_details.
```

- [ ] **`shared-ui-parts`**: Builds the shared parts from `docs/DESIGN.md`: `StatCard`, `StepIndicator`, `ViewAllLink` and `CategoryTile`. Gives buttons pressed and hover states and adds a shared card style.
  - Files: `src/components/ui.tsx`, `src/components/stat-card.tsx`, `src/components/step-indicator.tsx`, `src/components/view-all-link.tsx`, `src/components/category-tile.tsx`
  - Migration: no · Skill: frontend-design · SRS: NFR-08
  - Done: each part renders on a test page in the PR screenshots at 390 px and desktop; every text pair at least 4.5:1; tap targets at least 44 px.
- [ ] **`app-shell-sidebar`**: Adds the deep green desktop sidebar from the Owner Dashboard mockup to the staff app. Phones keep the bottom tab bar.
  - Files: `src/app/(app)/layout.tsx`, `src/components/sidebar.tsx`, `src/components/app-nav.tsx`
  - Migration: no · Skill: frontend-design · SRS: NFR-08
  - Done: sidebar from 1024 px with the active item in `primary`; tab bar unchanged under 640 px; keyboard focus visible.
- [ ] **`public-top-bar-footer`**: Moves the public top bar and footer into `TopBar` and `SiteFooter` in the mockup design. The footer's trust items follow DESIGN.md section 4 (no "secure payments").
  - Files: `src/app/(marketing)/layout.tsx`, `src/components/top-bar.tsx`, `src/components/site-footer.tsx`
  - Migration: no · Skill: frontend-design · SRS: NFR-12
  - Done: homepage, terms and privacy use both parts; footer stacks on phones; no NFR-12 words.
- [ ] **`db-business-profile`** (C1): Adds the business profile fields, the `profiles` table with phone and account state, and the payment details in the public booking and quote functions.
  - Files: `supabase/migrations/<timestamp>_business_profile.sql`, `supabase/tests/profile_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-AC-02, FR-AC-05, FR-PY-03
  - Done: tests show a customer link returns its own business's payment details only; signed-out visitors can't read `businesses.payment_details`; `set_my_phone` moves NEW to ACTIVE.
- [ ] **`settings-profile`** (C1): Adds logo upload, opening hours, BIPA number, "How customers pay you" and the owner's phone number to Settings. Merges after `db-business-profile`.
  - Files: `src/app/(app)/settings/page.tsx`, `src/app/(app)/settings/actions.ts`, `src/app/(app)/settings/sample-profile.ts` (removed before merge), `src/lib/types.ts`, `src/lib/business-profile.ts`, `src/lib/business-profile.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-AC-02
  - Done: the owner saves all fields; the logo shows in Settings; only the owner can edit; checks pass.
- [ ] **`email-sender-setup`**: Writes step-by-step instructions to make Resend or Brevo (free tier) Supabase's email sender, so login codes aren't limited to 2 an hour. You do the sign-up; the task checks it works.
  - Files: `docs/setup/email.md`
  - Migration: no · Skill: none · SRS: FR-AC-01 (changed: email login for the MVP)
  - Done: 5 login codes in a row arrive within a minute each.

---

## Wave 2: Home, staff pages and add item

### Contract C2: item photos

Database (`db-item-photos`):
- New table `item_photos (id uuid, item_id uuid, business_id uuid, path text, sort_order int, created_at)`, at most 5 per item; `sort_order` 0 is the cover. Paths stay in the `item-photos` bucket under the business id.
- The migration copies each `items.photo_path` into `item_photos` as the cover. `items.photo_path` stays and is kept equal to the cover by a trigger, so the quote page keeps working.
- `set_item_photos(p_item_id uuid, p_paths text[]) returns void`: replaces an item's photos in this order; staff of that business only; more than 5 is refused.

TypeScript (in `src/lib/types.ts`, written by `add-item-flow`):
```ts
export type ItemPhoto = { id: string; path: string; sort_order: number };
export type NewItemDraft = { category: string; name: string; description: string; photos: File[]; quantity_owned: number; daily_price: number; deposit: number; replacement_value: number | null; turnaround_days: number; low_stock_threshold: number };
```

- [ ] **`home-dashboard`**: Adds the Home page where staff land after sign-in: Today cards as stat cards, money recorded this month, recent bookings and the next checkouts. Phone tabs become Home, Calendar, Bookings, Quotes, More.
  - Files: `src/app/(app)/home/page.tsx`, `src/components/today-section.tsx`, `src/lib/nav.ts`, `src/lib/nav.test.ts`, `src/proxy.ts`, `src/app/login/actions.ts`, `src/app/auth/callback/route.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-CA-04, FR-CR-06, FR-RP-01
  - Done: sign-in and `/` go to `/home`; the counts match the bookings filters; Customers sits under More.
- [ ] **`restyle-bookings`**: Restyles the bookings list, booking page, new and edit booking, and the money and handover sections to DESIGN.md.
  - Files: `src/app/(app)/bookings/page.tsx`, `src/app/(app)/bookings/new/page.tsx`, `src/app/(app)/bookings/[id]/page.tsx`, `src/app/(app)/bookings/[id]/edit/page.tsx`, `src/app/(app)/bookings/[id]/money-section.tsx`, `src/app/(app)/bookings/[id]/handover-section.tsx`, `src/components/item-lines.tsx`, `src/components/package-lines.tsx`
  - Migration: no · Skill: frontend-design · SRS: FR-BK-01, FR-BK-02, FR-PY-03, NFR-08
  - Done: screenshots of every page at 390 px and desktop; no behaviour change.
- [ ] **`restyle-inventory-quotes`**: Restyles the inventory list, item edit page, packages and quotes to DESIGN.md. "Add item" is left to `add-item-flow`.
  - Files: `src/app/(app)/inventory/page.tsx`, `src/app/(app)/inventory/[id]/page.tsx`, `src/app/(app)/inventory/item-form.tsx`, `src/app/(app)/inventory/packages/**`, `src/app/(app)/quotes/**`
  - Migration: no · Skill: frontend-design · SRS: FR-IN-03, FR-QT-01, FR-QT-02
  - Done: screenshots; no behaviour change.
- [ ] **`restyle-customers-reports-plan`**: Restyles customers, reports, plan, invoices, More and the calendar (the Today cards move to Home). Invoices say "Tax invoice" only when a VAT number is set.
  - Files: `src/app/(app)/customers/**`, `src/app/(app)/reports/page.tsx`, `src/app/(app)/plan/**`, `src/app/(app)/more/page.tsx`, `src/app/(app)/calendar/page.tsx`
  - Migration: no · Skill: frontend-design · SRS: FR-RP-01, FR-PL-01, FR-FE-07
  - Done: screenshots; invoice heading follows the VAT rule.
- [ ] **`db-item-photos`** (C2): Adds `item_photos` with a cover and `set_item_photos`, keeping every current photo as the cover.
  - Files: `supabase/migrations/<timestamp>_item_photos_many.sql`, `supabase/tests/item_photo_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-IN-01
  - Done: tests show existing photos became covers, a sixth photo is refused, and other businesses can't change the list.
- [ ] **`add-item-flow`** (C2): Replaces the add item page with 4 steps (Details, Photos, Price and stock, Review) and up to 5 photos compressed on the phone. Merges after `db-item-photos`.
  - Files: `src/app/(app)/inventory/new/**` (steps, `actions.ts`, sample file removed before merge), `src/components/photo-upload.tsx`, `src/lib/types.ts`, `src/lib/item-photos.ts`, `src/lib/item-photos.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-IN-01, FR-IN-02, FR-CA-05, FR-PL-02, NFR-02
  - Done: an item with 3 photos is created on a phone; Back keeps entries; photos are 1600 px wide or smaller; the plan limit shows the upgrade prompt.

---

## Wave 3: customer pages, homepage and the first demo

### Contract C3: repair and retired units

Database (`db-units-out`):
- New type `units_out_reason` = `repair`, `retired`. New table `item_units_out (id uuid, item_id uuid, business_id uuid, quantity int > 0, reason units_out_reason, starts_on date, ends_on date null, note text, created_at, created_by)`. Retired entries have no `ends_on`.
- Availability (`item_availability` and the double-booking check) subtracts entries active on each day instead of `units_out_of_service`.
- The migration turns each item's `units_out_of_service` into a repair entry starting today with no end. The column stays, kept equal to today's units out by a trigger, and is no longer written by the app.
- `add_units_out(p_item_id uuid, p_quantity int, p_reason units_out_reason, p_starts_on date, p_ends_on date, p_note text) returns uuid`: refused if any day would drop below the units already booked.
- `end_units_out(p_id uuid, p_ends_on date) returns void`: ends a repair early.

TypeScript (in `src/lib/units-out.ts`, written by `units-out-screen`):
```ts
export type UnitsOutReason = "repair" | "retired";
export type UnitsOut = { id: string; quantity: number; reason: UnitsOutReason; starts_on: string; ends_on: string | null; note: string | null };
```

- [ ] **`restyle-customer-links`**: Restyles `/q` and `/b` with the deep green summary card and the "How to pay {business}" box from C1. No "secure", "protected" or "guaranteed", and each page under 500 KB.
  - Files: `src/app/q/[token]/page.tsx`, `src/app/b/[token]/page.tsx`, `src/app/b/[token]/handover-records.tsx`, `src/components/customer-page.tsx`
  - Migration: no · Skill: frontend-design · SRS: FR-AC-04, FR-QT-03, FR-PY-03, FR-PY-04, NFR-02, NFR-12
  - Done: both pages measured under 500 KB on a 390 px phone; payment details shown only when set.
- [ ] **`restyle-homepage`**: Restyles the public homepage to the mockup's look, with the SRS category tiles (Events, Tools, Construction and Machinery, Other).
  - Files: `src/app/(marketing)/page.tsx`, `src/lib/faq.ts`, `src/lib/faq.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-IN-06, NFR-12
  - Done: screenshots; no RentNow, card payment, wallet, service fee or distance (DESIGN.md section 4).
- [ ] **`demo-reset`**: Adds `npm run demo:reset`, which deletes and recreates "Kalahari Tent & Chair Hire" for the demo account, and writes `docs/DEMO.md`, the 5-minute two-phone demo. The script refuses any other business, and refuses to run unless the Supabase URL matches `DEMO_PROJECT_REF`.
  - Files: `scripts/demo-reset.mjs`, `scripts/demo-data.json`, `package.json`, `.env.example`, `docs/DEMO.md`
  - Migration: no · Skill: none · SRS: none (demo)
  - Done: running it twice gives the same data; it stops with a clear message on a wrong URL or a missing key.
- [ ] **`deploy-vercel`**: Writes the steps to put `main` on Vercel's free plan with the current Supabase project, and sets `NEXT_PUBLIC_SITE_URL` so WhatsApp links point to it. Notes the move to Vercel Pro and a production Supabase project before the first paying business.
  - Files: `docs/setup/vercel.md`
  - Migration: no · Skill: none · SRS: NFR-01
  - Done: the Vercel address opens on two phones; a quote link shared on WhatsApp opens there.
- [ ] **`db-units-out`** (C3): Adds repair and retired entries, switches availability to them, and turns every current "out of service" number into a repair entry.
  - Files: `supabase/migrations/<timestamp>_units_out.sql`, `supabase/tests/units_out_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-IN-04, FR-CA-01, FR-CA-02, NFR-04
  - Done: tests show existing numbers became entries, a repair that would clash with a booking is refused, and a booking that would clash with a repair is refused.
- [ ] **`units-out-screen`** (C3): On the item page, staff add a repair or retired entry, see the list and end a repair early. The old number field leaves the item form. Merges after `db-units-out`.
  - Files: `src/app/(app)/inventory/[id]/page.tsx`, `src/app/(app)/inventory/[id]/units-out.tsx`, `src/app/(app)/inventory/[id]/units-actions.ts`, `src/app/(app)/inventory/item-form.tsx`, `src/lib/units-out.ts`, `src/lib/units-out.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-IN-04
  - Done: a repair from today to Friday removes those units on the calendar for those days only.

**Milestone: the first demo with hire businesses, using `docs/DEMO.md` on the Vercel address.**

---

## Wave 4: staff and login

### Contract C4: staff invites and roles

Database (`db-staff-invites`):
- New table `business_invites (id uuid, business_id uuid, email text, role member_role, token text unique, invited_by uuid, created_at, expires_at (7 days), accepted_at, revoked_at)`.
- `create_invite(p_business_id uuid, p_email text, p_role member_role) returns text` (the token): owner only. Members plus open invites count against the plan's user limit; over it, the error is `plan_user_limit`.
- `revoke_invite(p_invite_id uuid)`, `remove_member(p_business_id uuid, p_user_id uuid)`: owner only; the owner can't remove themself.
- `accept_invite(p_token text) returns uuid` (the business id): signed in, the email must match, the invite must be open.
- Staff can't change prices: a trigger refuses changes to `daily_price`, `deposit`, `replacement_value` on items and `daily_price` on packages unless the user is the owner.

TypeScript (in `src/lib/staff.ts`, written by `staff-screens`):
```ts
export type MemberRole = "owner" | "staff";
export type Member = { user_id: string; email: string; phone: string | null; role: MemberRole };
export type Invite = { id: string; email: string; role: MemberRole; expires_at: string };
```

- [ ] **`db-staff-invites`** (C4): Adds invites, roles, the user limit and the owner-only price rule.
  - Files: `supabase/migrations/<timestamp>_staff_invites.sql`, `supabase/tests/staff_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-PL-02, NFR-05 (role checks)
  - Done: tests show staff can't change prices or invite; a Free business can't invite a second user; an expired or revoked invite can't be accepted.
- [ ] **`staff-screens`** (C4): Adds Settings → Staff (invite by email, list, remove) and the accept invite page. The invite link can be copied or shared on WhatsApp; email sending comes with `notify-sender`. Merges after `db-staff-invites`.
  - Files: `src/app/(app)/settings/staff/**`, `src/app/(app)/settings/page.tsx`, `src/app/invite/[token]/**`, `src/proxy.ts`, `src/lib/staff.ts`, `src/lib/staff.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-PL-02 (upgrade prompt)
  - Done: an invited staff member signs in and sees the business; over the limit shows the upgrade prompt.
- [ ] **`phone-at-login`**: After the first email login, asks for the phone number (using `set_my_phone` from C1) before the app opens.
  - Files: `src/app/login/page.tsx`, `src/app/phone/page.tsx`, `src/app/phone/actions.ts`, `src/lib/business.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-AC-01 (changed), FR-AC-05
  - Done: a new user can't reach the app without a phone number; their state becomes ACTIVE.

---

## Wave 5: notifications and offline forms

### Contract C5: notifications

Database (`db-notifications`):
- New table `notifications (id uuid, user_id uuid, business_id uuid, booking_id uuid null, kind text, title text, body text, url text, urgent boolean, created_at, read_at)`. Kinds: `request_new`, `booking_accepted`, `booking_declined`, `request_expired`, `checkout_tomorrow`, `return_due`, `overdue`, `problem_reported`, `review_request`, `plan_renewal`.
- New table `push_subscriptions (id, user_id, endpoint text unique, p256dh text, auth text, created_at)` and `notifications_sent (key text primary key, sent_at)` for once-only sends.
- Database triggers add a notification for each business member on booking events. `request_new`, `checkout_tomorrow` and `overdue` are urgent; urgent rows call the `notify` Edge Function (pg_net).
- A nightly Supabase Cron job (06:00 Windhoek) adds `checkout_tomorrow`, `return_due`, `overdue` and the 30, 7 and 1-day `plan_renewal` reminders, each once (key in `notifications_sent`); the 1-day reminder is urgent.
- `mark_notifications_read(p_ids uuid[])` (null = all), `save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)`, `delete_push_subscription(p_endpoint text)`.

Edge Function `notify` (`notify-sender`): input `{ notification_id: string }`; sends an email (Resend or Brevo API) and a web push (VAPID) to that user. Keys are Supabase secrets.

TypeScript (in `src/lib/notifications.ts`, written by `notifications-ui`):
```ts
export type NotificationKind = "request_new" | "booking_accepted" | "booking_declined" | "request_expired" | "checkout_tomorrow" | "return_due" | "overdue" | "problem_reported" | "review_request" | "plan_renewal";
export type AppNotification = { id: string; kind: NotificationKind; title: string; body: string; url: string; urgent: boolean; created_at: string; read_at: string | null };
```

- [ ] **`db-notifications`** (C5): Adds notifications, push subscriptions, once-only records, the triggers and the nightly job.
  - Files: `supabase/migrations/<timestamp>_notifications.sql`, `supabase/tests/notification_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-NT-01 (changed), FR-CR-06, FR-PL-04
  - Done: tests show a new request notifies every member once; running the nightly job twice sends nothing twice; users see only their own notifications.
- [ ] **`notify-sender`** (C5): Adds the `notify` Edge Function that sends the urgent email and push, and a setup guide for the keys. Merges after `db-notifications`.
  - Files: `supabase/functions/notify/index.ts`, `docs/setup/push-and-email.md`
  - Migration: no · Skill: none · SRS: FR-NT-01 (changed)
  - Done: a new request reaches the owner's phone as a push and an email within a minute.
- [ ] **`notifications-ui`** (C5): Adds the bell with an unread count, the notifications page, the web app manifest and icons (installable), and push sign-up. Merges after `db-notifications`.
  - Files: `src/components/notification-bell.tsx`, `src/app/(app)/notifications/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/manifest.ts`, `public/sw.js`, `public/icons/**`, `src/lib/notifications.ts`, `src/lib/notifications.test.ts`, `src/lib/push.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-NT-01 (changed)
  - Done: the app installs on an iPhone home screen and receives a push; reading a notification clears it.
- [ ] **`offline-handover-forms`**: Checkout and return forms save counts and notes on the phone as staff type, and restore them after a reload. Photos wait for the connection, and submit says "No connection" until it's back.
  - Files: `src/app/(app)/bookings/[id]/handover-section.tsx`, `src/lib/offline-draft.ts`, `src/lib/offline-draft.test.ts`
  - Migration: no · Skill: none · SRS: NFR-10
  - Done: in flight mode, entered counts survive a reload and submit when the connection returns.

---

## Wave 6: customer cancel

### Contract C6: customer cancel and withdraw

Database (`db-customer-cancel`):
- `cancel_public_booking(p_token text, p_reason text) returns text` (the new status): allowed before checkout; uses the same rules as `cancel_booking`; the reason is required; adds a booking event "Cancelled by the customer".
- `withdraw_public_request(p_token text) returns text`: only while `REQUESTED`.
- `get_public_booking` adds `can_cancel boolean` and `can_withdraw boolean`.

TypeScript (in `src/lib/types.ts`, written by `customer-cancel-ui`): `PublicBooking` gains `can_cancel: boolean; can_withdraw: boolean`.

- [ ] **`db-customer-cancel`** (C6): Adds the two public functions and the two flags.
  - Files: `supabase/migrations/<timestamp>_customer_cancel.sql`, `supabase/tests/customer_cancel_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-BK-06, FR-CA-03
  - Done: tests show a customer can't cancel after checkout, cancelling frees the stock, and another booking's token can't cancel it.
- [ ] **`customer-cancel-ui`** (C6): Adds Cancel and Withdraw to `/b`, with the reason and the refund note when the customer has paid. Merges after `db-customer-cancel`.
  - Files: `src/app/b/[token]/cancel-section.tsx`, `src/app/b/[token]/page.tsx`, `src/app/b/[token]/actions.ts`, `src/lib/types.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-BK-06, 2.4, NFR-12
  - Done: a paid customer sees "contact the business about a refund"; the business gets a notification.

---

## Wave 7: Report a Problem

### Contract C7: problems

Database (`db-problems`):
- New types `problem_state` = `OPEN`, `AWAITING_RESPONSE`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED` and `problem_type` = `DAMAGE`, `MISSING`, `NO_SHOW`, `DISPUTE`.
- New table `problems (id uuid, booking_id uuid, business_id uuid, reported_by text ('BUSINESS' or 'CUSTOMER'), type problem_type, description text, state problem_state, outcome text, customer_reply text, reopened boolean default false, created_at, resolved_at, closed_at)` and `problem_photos (id, problem_id, path)`. Each problem links the booking's checkout and return records as evidence.
- Staff: `report_problem(p_booking_id uuid, p_type problem_type, p_description text, p_photo_paths text[]) returns uuid`, `ask_customer(p_problem_id uuid, p_message text)` (→ AWAITING_RESPONSE), `resolve_problem(p_problem_id uuid, p_outcome text)` (→ RESOLVED).
- Customer: `report_public_problem(p_token text, p_type problem_type, p_description text, p_photo_paths text[]) returns uuid`, `reply_public_problem(p_token text, p_problem_id uuid, p_accept boolean, p_note text)`: accept → CLOSED; reopen → OPEN, once only.
- The existing return dispute creates a problem. The booking leaves `PROBLEM_OPEN` when its problems are closed. `UNDER_REVIEW` is used by the admin from Phase 2.
- Customer photos go to `handover-photos/<business id>/<booking id>/problems/`, through a signed upload URL from a server route that checks the token.

TypeScript (in `src/lib/problems.ts`, written by `problems-staff-ui`):
```ts
export type ProblemState = "OPEN" | "AWAITING_RESPONSE" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
export type ProblemType = "DAMAGE" | "MISSING" | "NO_SHOW" | "DISPUTE";
export type Problem = { id: string; reported_by: "BUSINESS" | "CUSTOMER"; type: ProblemType; description: string; state: ProblemState; outcome: string | null; customer_reply: string | null; reopened: boolean; photo_count: number; created_at: string };
```

- [ ] **`db-problems`** (C7): Adds problems, photos, the five states and the staff and customer functions.
  - Files: `supabase/migrations/<timestamp>_problems.sql`, `supabase/tests/problem_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-PR-01, FR-PR-02, FR-PR-04, FR-CR-05
  - Done: tests show a customer can reopen once, a token reaches only its own problems, and the booking closes when its problems close.
- [ ] **`problems-staff-ui`** (C7): Adds report, ask and resolve on the booking page. Merges after `db-problems`.
  - Files: `src/app/(app)/bookings/[id]/problem-section.tsx`, `src/app/(app)/bookings/[id]/page.tsx`, `src/components/problem-card.tsx`, `src/lib/problems.ts`, `src/lib/problems.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-PR-01, FR-PR-02
  - Done: staff report damage with 2 photos and resolve it with an outcome.
- [ ] **`problems-customer-ui`** (C7): Adds report, outcome, accept and reopen once on `/b`, with photo upload limited to the booking. Merges after `problems-staff-ui` (it uses `src/lib/problems.ts`).
  - Files: `src/app/b/[token]/problem-section.tsx`, `src/app/b/[token]/page.tsx`, `src/app/b/[token]/actions.ts`, `src/app/b/[token]/upload/route.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-PR-01, FR-CR-05, NFR-12
  - Done: a customer reports from a phone with a photo, sees the outcome, and the reopen button disappears after one use.

---

## Wave 8: reviews

### Contract C8: reviews

Database (`db-reviews`):
- New table `reviews (id uuid, booking_id uuid, business_id uuid, author text ('CUSTOMER' or 'BUSINESS'), subject text ('BUSINESS', 'ITEM' or 'CUSTOMER'), item_id uuid null, rating int 1 to 5, text text, created_at)`, one per booking, author, subject and item. Only for `CLOSED` bookings, within 14 days of closing (SRS 4.2).
- `submit_public_review(p_token text, p_rating int, p_text text, p_item_ratings jsonb)` (customer reviews the business and items), `submit_customer_review(p_booking_id uuid, p_rating int, p_text text)` (business reviews the customer).
- No public reading yet; `get_public_booking` adds `review_open boolean` and `my_review` (the customer's own review or null).

TypeScript (in `src/lib/reviews.ts`, written by `reviews-ui`):
```ts
export type Review = { id: string; author: "CUSTOMER" | "BUSINESS"; subject: "BUSINESS" | "ITEM" | "CUSTOMER"; item_id: string | null; rating: number; text: string; created_at: string };
```

- [ ] **`db-reviews`** (C8): Adds reviews with the closed-booking and 14-day rules.
  - Files: `supabase/migrations/<timestamp>_reviews.sql`, `supabase/tests/review_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-RV-01, FR-RV-02
  - Done: tests show no review before closing or after 14 days, one review per side, and no public reading.
- [ ] **`reviews-ui`** (C8): Adds the review form on `/b` and on the booking page. Merges after `db-reviews`.
  - Files: `src/app/b/[token]/review-section.tsx`, `src/app/b/[token]/page.tsx`, `src/app/b/[token]/actions.ts`, `src/app/(app)/bookings/[id]/review-section.tsx`, `src/app/(app)/bookings/[id]/page.tsx`, `src/lib/reviews.ts`, `src/lib/reviews.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-RV-01
  - Done: both sides review a closed booking; the star input works with one thumb.

---

## Wave 9: audit log

### Contract C9: audit log

Database (`db-audit-log`):
- New table `audit_logs (id bigint, business_id uuid null, actor uuid null, action text, entity text, entity_id uuid, details jsonb, created_at)`. Insert only through triggers: no update or delete for anyone.
- Triggers log price changes on items and packages, `item_units_out` changes, booking status changes, payment records and voids, plan changes, and suspensions.
- Owners read their own business's rows; platform admins read all. `booking_events` stays as it is.

TypeScript (in `src/lib/audit.ts`, written by `audit-log-screen`):
```ts
export type AuditEntry = { id: number; actor_email: string | null; action: string; entity: string; entity_id: string; details: Record<string, unknown>; created_at: string };
```

- [ ] **`db-audit-log`** (C9): Adds the add-only audit log and its triggers.
  - Files: `supabase/migrations/<timestamp>_audit_log.sql`, `supabase/tests/audit_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-AU-01, NFR-07
  - Done: tests show a price change is logged with user and time, nobody can edit or delete a row, and staff can't read the log.
- [ ] **`audit-log-screen`** (C9): Adds the owner's "Activity log" page under More, newest first, filterable by type. Merges after `db-audit-log`.
  - Files: `src/app/(app)/activity/page.tsx`, `src/lib/audit.ts`, `src/lib/audit.test.ts`, `src/lib/nav.ts`, `src/lib/nav.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-AU-01
  - Done: the owner sees a price change they made; staff don't see the link.

---

## Wave 10: admin

No contract: run `db-admin` first, then `admin-screens`.

- [ ] **`db-admin`**: Adds admin counts (active businesses, bookings this month, subscription revenue, open problems), suspend and unsuspend with a reason (written to the audit log, and blocking a suspended business's staff), and category management.
  - Files: `supabase/migrations/<timestamp>_admin_tools.sql`, `supabase/tests/admin_rules.sql`
  - Migration: **yes** · Skill: none · SRS: FR-AD-01, FR-AD-02, FR-AC-05
  - Done: tests show only admins can suspend or see counts, and a suspended business's staff are refused.
- [ ] **`admin-screens`**: Puts the admin pages in one layout: dashboard, businesses (with suspend), categories, and the existing plan payment and plan price pages.
  - Files: `src/app/admin/**`, `src/lib/admin.ts`, `src/lib/admin.test.ts`
  - Migration: no · Skill: frontend-design · SRS: FR-AD-01, FR-AD-02, FR-PL-03
  - Done: the admin suspends a test business and sees the counts change.

---

## After wave 10

- [ ] **`mvp-done-check`**: Runs the demo 3 times in a row on the Vercel address, checks every point in MASTER-PLAN.md "How we'll know the MVP is done", and lists the SRS changes to copy into the online SRS.
  - Files: `docs/MVP-CHECK.md`
  - Migration: no · Skill: none · SRS: section 9

## Phase 2 (split into tasks before it starts)

1. Customer accounts
2. Verification and the public flag (FR-AC-03, FR-IN-05)
3. Public listing pages and search (FR-SR-01, FR-SR-04, FR-SR-05)
4. Event search with guest counts (FR-SR-02)
5. Booking requests with masked messages and contact privacy (FR-BK-03, FR-PV-01 to FR-PV-03)
6. The booking fee step at Accept (FR-FE-01 to FR-FE-06)
7. Public reviews and profile stats (FR-RV-03)
8. Featured listings (SRS 3.3)
