# RentLoop master plan

Agreed in the interview on 20 October 2026. `docs/SRS.md` is the rulebook; this plan records the decisions that change or narrow it. `docs/DESIGN.md` sets the look. Check every new task against this file and say when something drifts from it.

## Goal

Finish the RentLoop MVP (SRS section 9) in the new design from `docs/DESIGN.md`. Then build the Phase 2 marketplace.

## Who it's for

- Hire businesses in Windhoek and Erongo: the owner and their staff, in the staff app.
- Their customers, on the quote and booking links, with no account (FR-AC-04).
- The platform admin.

## In scope: the MVP, in this order

1. **Restyle.** Shared parts first (top bar, sidebar, footer strip, stat cards, step indicator), then each staff page, then the customer pages, then the public homepage.
2. **First demo.** Right after the restyle, on Vercel's free plan, with demo data that loads with one command and can be reset.
3. **The missing P1 features:**
   - email login, with each user's phone number collected (FR-AC-01, changed)
   - staff invites by email, and roles
   - notifications: bell, push and email; the app becomes installable (FR-NT-01, changed)
   - business profile fields and account states (FR-AC-02, FR-AC-05)
   - the 4-step add item flow with up to 5 photos (FR-IN-01)
   - repair and retired units (FR-IN-04)
   - customer cancel and withdraw (FR-BK-06)
   - Report a Problem (FR-PR-01, 02, 04)
   - reviews, saved but not shown yet (FR-RV-01, 02)
   - the audit log (FR-AU-01)
   - admin tools (FR-AD-01, FR-AD-02)
   - renewal reminders (FR-PL-04)
   - offline checkout and return forms (NFR-10)

## Out of scope for the MVP

- SMS or WhatsApp login and messages, and any paid messaging.
- The payment gateway and card payments (fees and plans stay on proof of payment).
- Translations (NFR-09).
- Public reviews and profile stats (Phase 2).
- Everything else in Phase 2 and Phase 3.

## Decisions and why

### Login (FR-AC-01)
- Users sign in with an email code. Every user also gives a phone number.
- Resend or Brevo (free tier) becomes Supabase's email sender. Why: Supabase's built-in email allows only 2 emails an hour, and SMS costs money.

### Staff invites and roles
- The owner invites staff by email. Phone invites come with phone login.
- Two roles. Staff create quotes and bookings, run checkout and return, and record payments. Staff see prices to build quotes but can't change them.
- Only the owner sees reports, the plan and settings, changes prices, and invites or removes staff.
- The plan's user limit applies to invites; going over it shows the upgrade prompt (FR-PL-02).

### Notifications (FR-NT-01)
- Every FR-NT-01 event shows in the app under a bell.
- Urgent events (new request, checkout tomorrow, overdue) also send a free web push and an email.
- The app gets a web app manifest, so it installs to the home screen and push works on iPhone.
- Customers keep getting their links by one-tap WhatsApp from the business. No paid messaging in the MVP.

### Reviews (FR-RV-01, FR-RV-02)
- Both sides can review after a booking closes. Reviews are saved now and shown publicly in Phase 2. Why: there is nowhere to show them before the marketplace.

### Report a Problem (FR-PR-01, 02, 04)
- Staff report from the booking page; customers report from their link. Type (damage, missing items, no-show, dispute), description and photos.
- Each report links the checkout and return records as evidence.
- The database stores all five states (OPEN, AWAITING_RESPONSE, UNDER_REVIEW, RESOLVED, CLOSED). UNDER_REVIEW is used by the admin from Phase 2. Why: no extra migration later.
- When the business marks a report resolved, the customer sees the outcome on their link and can accept it or reopen it once.
- Customer photo uploads from the link are limited to that booking's folder, like handover photos.

### Repair and retired units (FR-IN-04)
- Units out are a list: quantity, reason (repair or retired), start date, and an end date for repairs.
- Repaired units come back by themselves on the end date. Retired units lower the stock in service for good.
- The migration turns each item's current "out of service" number into a repair entry, so no stock data is lost.
- The double-booking check keeps working with the list, with a new database test.

### Audit log (FR-AU-01)
- One add-only log, written by the database: price changes, units out, booking status, payment records and voids, plan changes, suspensions.
- The owner sees their own business's log; the admin sees all.
- The booking history (`booking_events`) stays as it is, alongside the audit log.

### Add item (FR-IN-01)
- Four steps: Details, Photos (up to 5, the first is the cover), Price and stock, Review. No drafts; Back keeps what was typed.
- Photos are compressed and resized on the phone before upload (NFR-02).
- The migration keeps each item's existing photo as its cover. Editing an item stays one page.

### Owner Dashboard
- A new Home page is where staff land after sign-in: Today cards, money recorded this month, recent bookings, next checkouts.
- Desktop gets the deep green sidebar. Phone tabs: Home, Calendar, Bookings, Quotes, More (Customers moves into More).

### Customer link pages (FR-AC-04, FR-PY-03, FR-PY-04)
- Both pages open with a deep green summary card: business, dates, status pill, "Still to pay" or the quote total.
- A "How to pay {business}" box shows the business's own payment details.
- Those details reach `/b` only through the public booking function, never by reading the table, and only for that business's own bookings.
- No "secure", "protected" or "guaranteed" anywhere (NFR-12). Each page stays under 500 KB on a phone (NFR-02).

### Customer cancel (FR-BK-06)
- Customers can cancel from their link until checkout, with a reason, through the same database rule as staff.
- If they have paid anything, the cancel screen tells them to contact the business about a refund. Why: RentLoop holds no money (2.4).
- Customers can withdraw a request that hasn't been accepted yet.
- The business gets the bell, a push and an email. Cancellations count on both sides for the Phase 2 profiles.

### Categories (FR-IN-06)
- Keep the SRS list: Events, Tools, Construction and Machinery, Other. The admin can add more. The homepage shows them as tiles.

### Business profile and account states (FR-AC-02, FR-AC-05)
- Settings adds a logo, opening hours (one line), the BIPA number (optional) and "How customers pay you".
- All six account states are stored. The MVP uses NEW, ACTIVE (after the first login with a phone number added), SUSPENDED and CLOSED. PHONE_VERIFIED waits for phone login; UNDER_REVIEW for Phase 2 verification.

### Admin (FR-AD-01, FR-AD-02)
- A dashboard with counts: active businesses, bookings this month, subscription revenue, open problems.
- A business list with each plan, and suspend or unsuspend with a reason (written to the audit log).
- Category management.
- The existing pages for approving plan payments and setting plan prices move into the same admin layout.
- Verification, listings, fee settings and featured slots wait for Phase 2.

### Renewal reminders (FR-PL-04)
- 30, 7 and 1 days before the plan ends: a bell notification and an email; the 1-day reminder also sends a push. The banner stays.
- Each reminder is sent once only (the database stores which were sent), from a nightly Supabase Cron job.

### Offline forms (NFR-10)
- Checkout and return forms save counts and notes on the phone as staff type, and restore them after a reload or a dropped connection.
- Photos wait with "Waiting for connection". The submit button says "No connection" until the connection is back.

### Demo
- A 5-minute demo on two phones (owner and customer), written in `docs/DEMO.md`, using "Kalahari Tent & Chair Hire": Home, a quote from "Wedding 100" on WhatsApp, the customer accepts, a double booking is refused, an EFT is recorded and confirmed, checkout and return with one damaged chair and a deposit deduction, reports.
- It happens right after the restyle, before the remaining P1 features, so what businesses say shapes them.
- `npm run demo:reset` deletes and recreates the demo business for a dedicated demo account. The admin key stays only in `.env.local`. The script refuses any business other than the demo one, and refuses to run unless the Supabase URL is the demo/development project.

### Hosting
- The demo runs on Vercel's free plan with the current Supabase project and `NEXT_PUBLIC_SITE_URL` set.
- Vercel's free plan doesn't allow commercial use. Before the first paying business, move to Vercel Pro (or another host) and a separate production Supabase project. Demo and development stay on the current project.

## Phase 2, in this order

The launch waits for the SRS gate: 30 to 50 businesses keeping their inventory and calendars in the app.

1. Customer accounts (email login, like staff).
2. Verification of businesses and the public flag on items (FR-AC-03, FR-IN-05). Why first: only public items from verified businesses may appear in search.
3. Public listing pages and search by item, town and date (FR-SR-01, FR-SR-04, FR-SR-05).
4. Event search with a guest count that suggests packages (FR-SR-02).
5. Booking requests from search with masked messages, built together with contact privacy enforced in the database (FR-BK-03, FR-PV-01, FR-PV-02, FR-PV-03).
6. The booking fee step at Accept, at 0% for the first three months (FR-FE-01 to FR-FE-06, SRS 3.1).
7. Public reviews and profile stats (FR-RV-03).
8. Featured listings (SRS 3.3).

## Changes to the SRS

Copy these into the online SRS before sales begin.

1. **FR-AC-01:** email login for the MVP; phone login later.
2. **FR-NT-01:** push and email instead of SMS or WhatsApp for the MVP.
3. **NFR-09:** translations after the MVP.

## Decide before Phase 2 (SRS section 8)

Booking fee values, refunds when a business cancels, refunds on customer cancellations and no-shows, the payment gateway, the lawyer's check on the fee model, launch towns, delivery.

Only VAT advice blocks the MVP. Until the accountant answers, invoices say "Tax invoice" only when a VAT number is set.

## How we'll know the MVP is done

- Every task in `docs/TASKS.md` is ticked off.
- Every staff and customer page is restyled to `docs/DESIGN.md`.
- The two-phone demo runs cleanly 3 times in a row on the Vercel address.
- Lint, typecheck, unit tests, database tests and the build pass on `main`.
- The SRS changes list is copied into the online SRS before sales begin.
